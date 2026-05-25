import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollText, ChevronRight, Calendar, ShoppingBasket, Store } from 'lucide-react';
import type { Commande, Commercant } from '@shared/types';
import { STATUT_LABELS, formatPrixCents } from '@shared/types';
import { listOrdersForClient } from '../lib/db';
import { useAuth } from '../lib/auth';
import { UserHeader } from '../components/UserHeader';
import { ProfileErrorBanner } from '../components/ProfileErrorBanner';
import { formatSlotShort } from '../lib/marketSlots';

type CommandeWithMerchant = Commande & {
  commercant?: Pick<Commercant, 'id' | 'nom_enseigne'>;
};

export default function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<CommandeWithMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      // Pas encore de profile chargé → on n'affiche pas le LoadingScreen indéfiniment,
      // on affiche l'état vide (ou il sera re-fetché dès que profile arrive).
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const list = await listOrdersForClient(profile.id_pass_wallet);
        setOrders(list);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id_pass_wallet]);

  const active = orders.filter((o) =>
    ['en_attente', 'confirmee', 'prete'].includes(o.statut)
  );
  const past = orders.filter((o) => ['retiree', 'annulee'].includes(o.statut));

  return (
    <div className="min-h-screen bg-paper">
      <UserHeader />

      <main className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        <ProfileErrorBanner />

        <header className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-olive-dark)] font-semibold mb-2">
            <ScrollText className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Historique
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-wood)]">
            Mes commandes
          </h1>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-[var(--color-paprika)]/10 border border-[var(--color-paprika)]/30 rounded-2xl text-xs text-[var(--color-paprika)]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[var(--color-shell)] border-t-[var(--color-olive)] rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[var(--color-taupe)]">
                Chargement de vos commandes…
              </p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <Section title="En cours" subtitle="Commandes à venir ou à retirer">
                {active.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </Section>
            )}
            {past.length > 0 && (
              <Section title="Passées" subtitle="Retirées ou annulées">
                {past.map((o) => (
                  <OrderRow key={o.id} order={o} muted />
                ))}
              </Section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3">
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--color-taupe)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-[var(--color-taupe-light)] mt-0.5">{subtitle}</p>
        )}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function OrderRow({
  order,
  muted,
}: {
  order: CommandeWithMerchant;
  muted?: boolean;
}) {
  return (
    <Link
      to={`/commandes/${order.id}`}
      className={`flex items-center gap-4 bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${
        muted ? 'opacity-80' : ''
      }`}
    >
      <div className="w-11 h-11 rounded-xl bg-[var(--color-sand)] border border-[var(--color-shell)] text-[var(--color-wood-soft)] flex items-center justify-center shrink-0">
        <ShoppingBasket className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display text-sm font-semibold text-[var(--color-wood)] truncate">
            {order.commercant?.nom_enseigne ?? 'Commerçant'}
          </p>
          <StatutBadge statut={order.statut} />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[var(--color-taupe)] mt-1 font-medium">
          {order.creneau_retrait && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatSlotShort(order.creneau_retrait)}
            </span>
          )}
          <span className="font-mono">
            {new Date(order.date_creation).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className="font-display text-base font-semibold text-[var(--color-wood)]">
          {formatPrixCents(order.total_cents)}
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-[var(--color-taupe)] shrink-0" />
    </Link>
  );
}

function StatutBadge({ statut }: { statut: Commande['statut'] }) {
  const styles: Record<Commande['statut'], string> = {
    en_attente: 'bg-[var(--color-straw)]/30 text-[var(--color-wood-soft)] border-[var(--color-straw)]/50',
    confirmee: 'bg-[var(--color-sage)]/20 text-[var(--color-olive-deep)] border-[var(--color-sage)]/40',
    prete: 'bg-[var(--color-olive)] text-[var(--color-cream)] border-[var(--color-olive)]',
    retiree: 'bg-[var(--color-shell)] text-[var(--color-taupe)] border-[var(--color-shell)]',
    annulee: 'bg-[var(--color-paprika)]/15 text-[var(--color-paprika)] border-[var(--color-paprika)]/30',
  };
  return (
    <span
      className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${styles[statut]}`}
    >
      {STATUT_LABELS[statut]}
    </span>
  );
}

function EmptyOrders() {
  return (
    <div className="bg-[var(--color-cream)] border border-dashed border-[var(--color-shell)] rounded-3xl p-12 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-shell)]/60 flex items-center justify-center mb-4">
        <ScrollText className="w-6 h-6 text-[var(--color-taupe)]" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-wood)] mb-1">
        Aucune commande pour l'instant.
      </h3>
      <p className="text-xs text-[var(--color-taupe)] mt-2 max-w-md mx-auto">
        Passez votre première commande auprès d'un commerçant du marché.
      </p>
      <Link
        to="/commercants"
        className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] text-[var(--color-cream)] rounded-full text-xs font-semibold transition-colors"
      >
        <Store className="w-3.5 h-3.5" />
        Voir les commerçants
      </Link>
    </div>
  );
}
