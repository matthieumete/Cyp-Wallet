import { useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Inbox,
  Loader2,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  Commercant,
  MerchantOrder,
  StatutCommande,
  STATUT_LABELS,
  formatPrixCents,
} from '../types';
import { DbManager } from '../db';

interface OrdersProps {
  merchant: Commercant;
}

type Filter = 'a_traiter' | StatutCommande | 'all';

const FILTERS: { value: Filter; label: string; statuts: StatutCommande[] }[] = [
  { value: 'a_traiter', label: 'À traiter', statuts: ['en_attente', 'confirmee'] },
  { value: 'prete', label: 'Prêtes', statuts: ['prete'] },
  { value: 'retiree', label: 'Retirées', statuts: ['retiree'] },
  { value: 'annulee', label: 'Annulées', statuts: ['annulee'] },
  { value: 'all', label: 'Toutes', statuts: ['en_attente', 'confirmee', 'prete', 'retiree', 'annulee'] },
];

const STATUT_STYLES: Record<StatutCommande, { dot: string; chip: string }> = {
  en_attente: {
    dot: 'bg-[var(--color-straw)]',
    chip: 'bg-[var(--color-straw)]/15 text-[var(--color-wood-soft)] border-[var(--color-straw)]/40',
  },
  confirmee: {
    dot: 'bg-[var(--color-sage)]',
    chip: 'bg-[var(--color-sage)]/15 text-[var(--color-olive-deep)] border-[var(--color-sage)]/40',
  },
  prete: {
    dot: 'bg-[var(--color-olive)]',
    chip: 'bg-[var(--color-olive)]/15 text-[var(--color-olive-deep)] border-[var(--color-olive)]/40',
  },
  retiree: {
    dot: 'bg-[var(--color-stone)]',
    chip: 'bg-[var(--color-sand)] text-[var(--color-taupe)] border-[var(--color-shell)]',
  },
  annulee: {
    dot: 'bg-[var(--color-paprika)]',
    chip: 'bg-[var(--color-paprika)]/10 text-[var(--color-paprika)] border-[var(--color-paprika)]/30',
  },
};

export default function Orders({ merchant }: OrdersProps) {
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('a_traiter');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const fetchOrders = useCallback(
    async (isBackground = false) => {
      if (isBackground) setRefreshing(true);
      else setLoading(true);
      const res = await DbManager.listMerchantOrders(merchant.id);
      if (res.error) setError(res.error);
      else {
        setError(null);
        setOrders(res.data);
        setLastSyncAt(new Date());
      }
      if (isBackground) setRefreshing(false);
      else setLoading(false);
    },
    [merchant.id]
  );

  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  // Auto-refresh toutes les 30s en arrière-plan pour voir les nouvelles commandes.
  useEffect(() => {
    const id = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const counts = useMemo(() => {
    const out: Record<Filter, number> = {
      a_traiter: 0,
      en_attente: 0,
      confirmee: 0,
      prete: 0,
      retiree: 0,
      annulee: 0,
      all: orders.length,
    };
    orders.forEach((o) => {
      out[o.statut]++;
      if (o.statut === 'en_attente' || o.statut === 'confirmee') out.a_traiter++;
    });
    return out;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const cfg = FILTERS.find((f) => f.value === filter);
    if (!cfg) return orders;
    return orders.filter((o) => cfg.statuts.includes(o.statut));
  }, [orders, filter]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdvance = async (order: MerchantOrder, nextStatut: StatutCommande) => {
    setUpdatingIds((prev) => new Set(prev).add(order.id));
    const res = await DbManager.updateOrderStatus(order.id, nextStatut);
    setUpdatingIds((prev) => {
      const n = new Set(prev);
      n.delete(order.id);
      return n;
    });
    if (!res.success) {
      setError(res.error ?? 'Mise à jour impossible.');
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? { ...o, statut: nextStatut, date_modification: new Date().toISOString() }
          : o
      )
    );
  };

  const aTraiterCount = counts.a_traiter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-display font-bold text-[var(--color-wood)] tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[var(--color-olive)]/10 border border-[var(--color-olive)]/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[var(--color-olive-deep)]" />
            </span>
            Commandes du marché
          </h2>
          <p className="text-xs text-[var(--color-taupe)]">
            {aTraiterCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Bell className="w-3 h-3 text-[var(--color-terracotta)] animate-pulse" />
                <strong className="text-[var(--color-terracotta)] font-mono font-bold">{aTraiterCount}</strong>{' '}
                commande{aTraiterCount > 1 ? 's' : ''} à traiter
              </span>
            ) : (
              <span>Aucune commande en attente. Tout est à jour.</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastSyncAt && (
            <span className="text-[10px] text-[var(--color-taupe-light)] font-mono hidden sm:inline">
              Sync {lastSyncAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--color-cream)] border border-[var(--color-shell)] hover:bg-[var(--color-sand)] disabled:opacity-50 rounded-xl text-[11px] font-bold uppercase tracking-wider text-[var(--color-taupe)] hover:text-[var(--color-wood)] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === f.value
                ? 'bg-[var(--color-olive)] text-[var(--color-cream)] border-[var(--color-olive)] shadow-md shadow-[var(--color-olive)]/20'
                : 'bg-[var(--color-cream)] text-[var(--color-taupe)] border-[var(--color-shell)] hover:text-[var(--color-wood)] hover:border-[var(--color-stone)]'
            }`}
          >
            {f.label}
            <span
              className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md text-[10px] font-mono ${
                filter === f.value
                  ? 'bg-[var(--color-olive-deep)] text-[var(--color-cream)]'
                  : 'bg-[var(--color-sand)] text-[var(--color-taupe)]'
              }`}
            >
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[var(--color-paprika)]/10 border border-[var(--color-paprika)]/30 rounded-2xl p-4 text-xs text-[var(--color-paprika)] flex items-start gap-2">
          <X className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-[var(--color-paprika)] block mb-0.5">Erreur</strong>
            {error}
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-10 flex items-center justify-center text-[var(--color-taupe)] text-xs">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Chargement des commandes…
        </div>
      ) : visibleOrders.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              expanded={expanded.has(o.id)}
              onToggle={() => toggleExpand(o.id)}
              onAdvance={handleAdvance}
              updating={updatingIds.has(o.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
  onAdvance,
  updating,
}: {
  order: MerchantOrder;
  expanded: boolean;
  onToggle: () => void;
  onAdvance: (o: MerchantOrder, s: StatutCommande) => void;
  updating: boolean;
}) {
  const style = STATUT_STYLES[order.statut];
  const totalItems = order.items.reduce((s, it) => s + it.quantite, 0);
  const isTerminal = order.statut === 'retiree' || order.statut === 'annulee';

  return (
    <div
      className={`bg-[var(--color-cream)] border rounded-3xl shadow-md overflow-hidden transition-all ${
        order.statut === 'en_attente'
          ? 'border-[var(--color-straw)]/40 shadow-md shadow-[var(--color-straw)]/10'
          : 'border-[var(--color-shell)]'
      }`}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--color-sand)] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={`w-2 h-10 rounded-full ${style.dot}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-[var(--color-wood)] truncate flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[var(--color-taupe-light)]" />
                {order.client_nom ?? '—'}
              </p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${style.chip}`}
              >
                {STATUT_LABELS[order.statut]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--color-taupe-light)] font-mono">
              <span>#{order.id.slice(0, 8)}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelative(order.date_creation)}
              </span>
              <span>•</span>
              <span>
                {totalItems} article{totalItems > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="font-display text-base md:text-lg font-bold text-[var(--color-wood)] font-mono">
            {formatPrixCents(order.total_cents)}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--color-taupe-light)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-taupe-light)]" />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-slate-800 px-5 py-5 space-y-5 bg-slate-950/40">
          {/* Pickup + phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {order.creneau_retrait && (
              <InfoLine label="Créneau de retrait" icon={<Package className="w-3.5 h-3.5" />}>
                {formatPickup(order.creneau_retrait)}
              </InfoLine>
            )}
            {order.client_telephone && (
              <InfoLine label="Téléphone client" icon={<Phone className="w-3.5 h-3.5" />}>
                <a
                  href={`tel:${order.client_telephone}`}
                  className="text-white hover:text-amber-300 transition-colors font-mono"
                >
                  {order.client_telephone}
                </a>
              </InfoLine>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Détail de la commande
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
              {order.items.length === 0 ? (
                <p className="text-xs text-slate-500 px-4 py-3 italic">
                  Aucun article — la commande a peut-être été créée sans détail.
                </p>
              ) : (
                order.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono font-bold text-[11px]">
                        ×{it.quantite}
                      </span>
                      <div className="min-w-0">
                        <p className="text-slate-200 font-semibold truncate">{it.produit_nom}</p>
                        {it.unite && (
                          <p className="text-[10px] text-slate-500">{it.unite}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-slate-400 font-mono">
                        {formatPrixCents(it.prix_unitaire_cents)}
                      </p>
                      <p className="text-white font-mono font-bold">
                        {formatPrixCents(it.prix_unitaire_cents * it.quantite)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Note client */}
          {order.note_client && (
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Note du client
              </p>
              <p className="text-xs text-slate-200 italic leading-relaxed">
                « {order.note_client} »
              </p>
            </div>
          )}

          {/* Actions */}
          {!isTerminal && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <ActionButtons order={order} onAdvance={onAdvance} disabled={updating} />
              {updating && (
                <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 ml-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Mise à jour…
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButtons({
  order,
  onAdvance,
  disabled,
}: {
  order: MerchantOrder;
  onAdvance: (o: MerchantOrder, s: StatutCommande) => void;
  disabled: boolean;
}) {
  switch (order.statut) {
    case 'en_attente':
      return (
        <>
          <PrimaryAction
            onClick={() => onAdvance(order, 'confirmee')}
            disabled={disabled}
            icon={<Check className="w-3.5 h-3.5" />}
            label="Confirmer la commande"
          />
          <SecondaryAction
            onClick={() => onAdvance(order, 'annulee')}
            disabled={disabled}
            icon={<X className="w-3.5 h-3.5" />}
            label="Annuler"
            danger
          />
        </>
      );
    case 'confirmee':
      return (
        <>
          <PrimaryAction
            onClick={() => onAdvance(order, 'prete')}
            disabled={disabled}
            icon={<PackageCheck className="w-3.5 h-3.5" />}
            label="Marquer comme prête"
          />
          <SecondaryAction
            onClick={() => onAdvance(order, 'annulee')}
            disabled={disabled}
            icon={<X className="w-3.5 h-3.5" />}
            label="Annuler"
            danger
          />
        </>
      );
    case 'prete':
      return (
        <PrimaryAction
          onClick={() => onAdvance(order, 'retiree')}
          disabled={disabled}
          icon={<Check className="w-3.5 h-3.5" />}
          label="Marquer comme retirée"
        />
      );
    default:
      return null;
  }
}

function PrimaryAction({
  onClick,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
    >
      {icon}
      {label}
    </button>
  );
}

function SecondaryAction({
  onClick,
  disabled,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: ReactNode;
  label: string;
  danger?: boolean;
}) {
  const tone = danger
    ? 'text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border-rose-500/30'
    : 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2.5 border disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${tone}`}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoLine({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
        <span className="text-slate-400">{icon}</span>
        {label}
      </p>
      <p className="text-xs text-slate-200 font-semibold">{children}</p>
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const cfg = FILTERS.find((f) => f.value === filter);
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-200">Aucune commande</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        {filter === 'a_traiter'
          ? 'Aucune commande en attente. Les nouvelles commandes apparaissent ici dès qu’un client en passe une depuis le portail.'
          : `Aucune commande dans la catégorie « ${cfg?.label.toLowerCase()} » pour l’instant.`}
      </p>
    </div>
  );
}

// ───────────────────────────── formatters ─────────────────────────────

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function formatPickup(iso: string): string {
  const d = new Date(iso);
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} · matin`;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `il y a ${j}j`;
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
}
