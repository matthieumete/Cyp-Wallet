import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  AlertCircle,
} from 'lucide-react';
import type { CommandeAvecItems, StatutCommande } from '@shared/types';
import { STATUT_LABELS, formatPrixCents } from '@shared/types';
import { cancelOrder, getOrderDetail } from '../lib/db';
import { UserHeader } from '../components/UserHeader';
import { LoadingScreen } from '../components/ProtectedRoute';
import { formatSlotShort } from '../lib/marketSlots';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<CommandeAvecItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const o = await getOrderDetail(id);
        setOrder(o);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!order) {
    return (
      <div className="min-h-screen bg-paper">
        <UserHeader />
        <main className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-sm text-[var(--color-paprika)]">
            {error ?? 'Commande introuvable.'}
          </p>
          <Link
            to="/commandes"
            className="inline-block mt-4 text-xs font-semibold text-[var(--color-olive-dark)] underline"
          >
            Retour à mes commandes
          </Link>
        </main>
      </div>
    );
  }

  const handleCancel = async () => {
    if (!confirm("Êtes-vous sûr d'annuler cette commande ?")) return;
    setCancelling(true);
    const res = await cancelOrder(order.id);
    setCancelling(false);
    if (!res.success) {
      alert(`Erreur : ${res.error}`);
      return;
    }
    navigate('/commandes', { replace: true });
  };

  return (
    <div className="min-h-screen bg-paper">
      <UserHeader />

      <main className="max-w-3xl mx-auto px-6 py-8 md:py-12">
        <Link
          to="/commandes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-taupe)] hover:text-[var(--color-wood)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Mes commandes
        </Link>

        <StatusBanner statut={order.statut} />

        <header className="mt-6 mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-olive-dark)] font-semibold mb-1">
            Commande #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-wood)]">
            {order.commercant?.nom_enseigne ?? 'Commerçant'}
          </h1>
        </header>

        <section className="grid sm:grid-cols-2 gap-4 mb-6">
          <DetailBox
            icon={<Calendar className="w-4 h-4" />}
            label="Créneau de retrait"
            value={order.creneau_retrait ? formatSlotShort(order.creneau_retrait) : 'À confirmer'}
            sub="Présentez votre pass au commerçant"
          />
          <DetailBox
            icon={<Clock className="w-4 h-4" />}
            label="Commandée le"
            value={new Date(order.date_creation).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            sub={new Date(order.date_creation).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </section>

        <section className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-5 shadow-sm mb-5">
          <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-taupe)] font-semibold mb-4 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[var(--color-olive)]" />
            Articles ({order.items.length})
          </h2>
          <div className="divide-y divide-[var(--color-shell)]/70">
            {order.items.map((it) => (
              <div key={it.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-wood)]">
                    {it.produit_nom}
                  </p>
                  <p className="text-[11px] text-[var(--color-taupe)] mt-0.5 font-mono">
                    {it.quantite} × {formatPrixCents(it.prix_unitaire_cents)}
                    {it.unite ? ` / ${it.unite}` : ''}
                  </p>
                </div>
                <p className="text-sm font-display font-semibold text-[var(--color-wood)]">
                  {formatPrixCents(it.prix_unitaire_cents * it.quantite)}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-2 border-t border-[var(--color-shell)]/70 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-taupe)]">
              Total
            </span>
            <span className="font-display text-xl font-semibold text-[var(--color-wood)]">
              {formatPrixCents(order.total_cents)}
            </span>
          </div>
        </section>

        {order.note_client && (
          <section className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-5 shadow-sm mb-5">
            <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-taupe)] font-semibold mb-2">
              Votre note
            </h2>
            <p className="text-sm text-[var(--color-wood-soft)] leading-relaxed">
              {order.note_client}
            </p>
          </section>
        )}

        {order.statut === 'en_attente' && (
          <section className="bg-[var(--color-paprika)]/8 border border-[var(--color-paprika)]/25 rounded-3xl p-5 text-center">
            <p className="text-xs text-[var(--color-wood-soft)] mb-3">
              Vous pouvez encore annuler tant que la commande n'est pas confirmée.
            </p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-paprika)] hover:bg-[var(--color-terracotta-dark)] disabled:opacity-60 text-[var(--color-cream)] rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              {cancelling ? 'Annulation…' : 'Annuler la commande'}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function StatusBanner({ statut }: { statut: StatutCommande }) {
  const config: Record<
    StatutCommande,
    { icon: React.ReactNode; tint: string; text: string }
  > = {
    en_attente: {
      icon: <Clock className="w-5 h-5" />,
      tint: 'bg-[var(--color-straw)]/20 border-[var(--color-straw)]/40 text-[var(--color-wood-soft)]',
      text: "Votre commande a été envoyée au commerçant. Il la confirmera bientôt.",
    },
    confirmee: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      tint: 'bg-[var(--color-sage)]/15 border-[var(--color-sage)]/40 text-[var(--color-olive-deep)]',
      text: 'Confirmée par le commerçant. Elle sera préparée pour votre créneau.',
    },
    prete: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      tint: 'bg-[var(--color-olive)] border-[var(--color-olive)] text-[var(--color-cream)]',
      text: 'Votre commande est prête à être retirée sur le marché.',
    },
    retiree: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      tint: 'bg-[var(--color-shell)] border-[var(--color-stone)] text-[var(--color-taupe)]',
      text: 'Commande retirée. Merci pour votre visite au marché.',
    },
    annulee: {
      icon: <AlertCircle className="w-5 h-5" />,
      tint: 'bg-[var(--color-paprika)]/15 border-[var(--color-paprika)]/30 text-[var(--color-paprika)]',
      text: 'Cette commande a été annulée.',
    },
  };
  const c = config[statut];
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${c.tint}`}>
      <div className="shrink-0 mt-0.5">{c.icon}</div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider">
          {STATUT_LABELS[statut]}
        </p>
        <p className="text-xs mt-0.5 leading-relaxed opacity-90">{c.text}</p>
      </div>
    </div>
  );
}

function DetailBox({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-[var(--color-olive)] mb-1.5">
        {icon}
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-taupe)] font-semibold">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-[var(--color-wood)]">{value}</p>
      {sub && <p className="text-[11px] text-[var(--color-taupe)] mt-0.5">{sub}</p>}
    </div>
  );
}
