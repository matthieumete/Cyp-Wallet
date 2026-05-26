import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import QRCode from 'qrcode';
import {
  CreditCard,
  ShoppingBasket,
  Store,
  Coins,
  ArrowRight,
  Calendar,
  Package,
  ChevronRight,
} from 'lucide-react';
import type { Commande, Commercant } from '@shared/types';
import { STATUT_LABELS, formatPrixCents } from '@shared/types';
import { useAuth } from '../lib/auth';
import { listOrdersForClient } from '../lib/db';
import { UserHeader } from '../components/UserHeader';
import { ProfileErrorBanner } from '../components/ProfileErrorBanner';
import { formatSlotShort } from '../lib/marketSlots';

type CommandeWithMerchant = Commande & {
  commercant?: Pick<Commercant, 'id' | 'nom_enseigne'>;
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<CommandeWithMerchant[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const displayName = profile?.nom || user?.email?.split('@')[0] || 'Client';

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const all = await listOrdersForClient(profile.id_pass_wallet);
        setActiveOrders(
          all.filter((o) => ['en_attente', 'confirmee', 'prete'].includes(o.statut))
        );
      } catch {
        setActiveOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [profile?.id_pass_wallet]);

  return (
    <div className="min-h-screen bg-paper text-[var(--color-wood)]">
      <UserHeader />

      <main className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-8">
        <ProfileErrorBanner />

        <section>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-olive-dark)] font-semibold mb-2">
            Bonjour {displayName.split(' ')[0]}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Bienvenue sur votre portail.
          </h1>
          <p className="text-sm text-[var(--color-taupe)] mt-2 max-w-2xl">
            Votre pass de fidélité est prêt — découvrez les commerçants du marché
            et passez votre première commande.
          </p>
        </section>

        <PassCard profile={profile} email={user?.email ?? null} />

        {/* Active orders preview */}
        {!loadingOrders && activeOrders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--color-taupe)]">
                Vos commandes en cours
              </h2>
              <Link
                to="/commandes"
                className="text-[11px] font-semibold text-[var(--color-olive-dark)] hover:text-[var(--color-olive-deep)] inline-flex items-center gap-1"
              >
                Voir tout
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {activeOrders.slice(0, 2).map((o) => (
                <ActiveOrderCard key={o.id} order={o} />
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <section className="grid md:grid-cols-3 gap-4">
          <ActionCard
            to="/commercants"
            icon={<Store className="w-5 h-5" />}
            tint="var(--color-olive)"
            title="Le marché"
            text="Parcourez les commerçants et leurs produits du moment."
          />
          <ActionCard
            to="/panier"
            icon={<ShoppingBasket className="w-5 h-5" />}
            tint="var(--color-terracotta)"
            title="Mon panier"
            text="Reprenez votre panier en cours ou validez votre commande."
          />
          <ActionCard
            to="/commandes"
            icon={<Coins className="w-5 h-5" />}
            tint="var(--color-straw)"
            title="Mon historique"
            text="Retrouvez vos commandes passées et à venir."
          />
        </section>
      </main>
    </div>
  );
}

function PassCard({
  profile,
  email,
}: {
  profile: ReturnType<typeof useAuth>['profile'];
  email: string | null;
}) {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const passId = profile?.id_pass_wallet ?? null;

  useEffect(() => {
    if (!passId || !qrCanvasRef.current) return;
    QRCode.toCanvas(
      qrCanvasRef.current,
      passId,
      { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } },
      (error) => {
        if (error) console.error('[portal] QR generation failed:', error);
      }
    );
  }, [passId]);

  return (
    <div className="relative bg-gradient-to-br from-[var(--color-olive)] to-[var(--color-moss)] rounded-3xl p-7 md:p-8 shadow-xl shadow-[var(--color-olive-deep)]/20 overflow-hidden">
      <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-[var(--color-sage-light)]/20 blur-2xl" />
      <div className="absolute -left-6 -bottom-10 w-56 h-56 rounded-full bg-[var(--color-straw)]/15 blur-3xl" />

      <div className="relative grid md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-[var(--color-cream)]/80" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-cream)]/80 font-semibold">
              Mon Pass Fidélité
            </span>
          </div>
          {passId ? (
            <div className="bg-white rounded-2xl p-3 shadow-md">
              <canvas ref={qrCanvasRef} className="block w-[200px] h-[200px]" />
            </div>
          ) : (
            <div className="w-[200px] h-[200px] rounded-2xl bg-[var(--color-cream)]/10 border border-[var(--color-cream)]/15 flex items-center justify-center text-[var(--color-cream)]/60 text-sm">
              —
            </div>
          )}
          <p className="text-xs text-[var(--color-cream)]/80 mt-3 text-center md:text-left max-w-[220px]">
            Présentez ce QR code aux commerçants pour cumuler vos points.
          </p>
        </div>

        <div className="bg-[var(--color-cream)]/10 backdrop-blur-sm border border-[var(--color-cream)]/15 rounded-2xl p-5 space-y-3">
          <Detail label="Nom" value={profile?.nom ?? '—'} />
          <Detail label="Email" value={email ?? profile?.email ?? '—'} />
          <Detail label="Téléphone" value={profile?.telephone || 'Non renseigné'} mono />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--color-cream)]/65 font-semibold mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm text-[var(--color-cream)] font-medium truncate ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ActiveOrderCard({ order }: { order: CommandeWithMerchant }) {
  return (
    <Link
      to={`/commandes/${order.id}`}
      className="block bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="font-display text-sm font-semibold text-[var(--color-wood)] truncate">
          {order.commercant?.nom_enseigne ?? 'Commerçant'}
        </p>
        <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[var(--color-olive)] text-[var(--color-cream)] shrink-0">
          {STATUT_LABELS[order.statut]}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px]">
        {order.creneau_retrait && (
          <span className="inline-flex items-center gap-1 text-[var(--color-taupe)]">
            <Calendar className="w-3 h-3" />
            {formatSlotShort(order.creneau_retrait)}
          </span>
        )}
        <span className="font-display font-semibold text-[var(--color-wood)]">
          {formatPrixCents(order.total_cents)}
        </span>
      </div>
    </Link>
  );
}

function ActionCard({
  to,
  icon,
  tint,
  title,
  text,
}: {
  to: string;
  icon: ReactNode;
  tint: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="group block bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-[var(--color-cream)]"
          style={{ backgroundColor: tint }}
        >
          {icon}
        </div>
        <ArrowRight className="w-4 h-4 text-[var(--color-taupe)] group-hover:translate-x-0.5 transition-transform" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-wood)] mb-1.5 group-hover:text-[var(--color-olive-dark)] transition-colors">
        {title}
      </h3>
      <p className="text-xs text-[var(--color-taupe)] leading-relaxed">{text}</p>
    </Link>
  );
}
