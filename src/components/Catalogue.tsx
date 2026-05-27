import { useEffect, useMemo, useState, ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Plus,
  Package,
  CheckCircle2,
  XCircle,
  Search,
  Pencil,
  ShoppingBag,
  Sparkles,
  Tag,
  Layers,
  Inbox,
} from 'lucide-react';
import { Commercant, Produit, formatPrixCents } from '../types';
import { DbManager } from '../db';
import ProduitForm from './ProduitForm';
import { ShinyButton } from './ui/shiny-button';

interface CatalogueProps {
  merchant: Commercant;
}

type Filter = 'all' | 'available' | 'unavailable';

export default function Catalogue({ merchant }: CatalogueProps) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categorieFilter, setCategorieFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<Produit | 'new' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProduits();
  }, [merchant.id]);

  const fetchProduits = async () => {
    setLoading(true);
    const res = await DbManager.listProduits(merchant.id);
    setProduits(res.data);
    setLoading(false);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    produits.forEach((p) => {
      if (p.categorie) set.add(p.categorie);
    });
    return Array.from(set).sort();
  }, [produits]);

  const stats = useMemo(() => {
    const available = produits.filter((p) => p.disponible).length;
    return {
      total: produits.length,
      available,
      unavailable: produits.length - available,
    };
  }, [produits]);

  const filteredProduits = useMemo(() => {
    return produits.filter((p) => {
      if (filter === 'available' && !p.disponible) return false;
      if (filter === 'unavailable' && p.disponible) return false;
      if (categorieFilter && p.categorie !== categorieFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const haystack = `${p.nom} ${p.description || ''} ${p.categorie || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [produits, filter, categorieFilter, searchTerm]);

  const handleSave = async (
    fields: Omit<Produit, 'id' | 'date_creation' | 'date_modification'>
  ) => {
    setSubmitting(true);
    const res =
      editing && editing !== 'new'
        ? await DbManager.updateProduit(editing.id, fields)
        : await DbManager.createProduit(fields);
    setSubmitting(false);

    if (!res.success) {
      alert("Erreur lors de l'enregistrement du produit : " + (res.error || 'inconnu'));
      return;
    }
    setEditing(null);
    fetchProduits();
  };

  const handleDelete = async () => {
    if (!editing || editing === 'new') return;
    setSubmitting(true);
    const res = await DbManager.deleteProduit(editing.id);
    setSubmitting(false);
    if (!res.success) {
      alert('Erreur lors de la suppression : ' + (res.error || 'inconnu'));
      return;
    }
    setEditing(null);
    fetchProduits();
  };

  const handleToggleDisponibilite = async (produit: Produit) => {
    setTogglingIds((prev) => new Set(prev).add(produit.id));
    const res = await DbManager.setProduitDisponibilite(produit.id, !produit.disponible);
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.delete(produit.id);
      return next;
    });
    if (!res.success) {
      alert('Erreur lors du changement de disponibilité : ' + (res.error || 'inconnu'));
      return;
    }
    setProduits((curr) =>
      curr.map((p) => (p.id === produit.id ? { ...p, disponible: !p.disponible } : p))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl shadow-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-[var(--color-wood-soft)]" />
              <span className="text-[10px] font-bold text-[var(--color-taupe)] uppercase tracking-[0.18em] font-mono">
                Catalogue produits
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-display font-extrabold text-[var(--color-wood)] tracking-tight uppercase">
              Vos produits du moment
            </h2>
            <p className="text-xs text-[var(--color-taupe)] mt-1 max-w-md">
              Ajoutez, modifiez, et masquez ce qui n'est plus en stock. Les produits disponibles
              sont visibles depuis le portail client.
            </p>
          </div>

          <ShinyButton
            type="button"
            onClick={() => setEditing('new')}
            className="shrink-0 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] text-[var(--color-cream)] rounded-full font-semibold shadow-md shadow-[var(--color-olive)]/20"
            id="add-produit-btn"
          >
            <Plus className="w-4 h-4 text-[var(--color-cream)]" />
            Ajouter un produit
          </ShinyButton>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard
            icon={<Package className="w-4 h-4 text-[var(--color-wood-soft)]" />}
            label="Produits"
            value={stats.total}
            tint="bg-[var(--color-sand)] border-[var(--color-shell)]"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4 text-[var(--color-olive)]" />}
            label="Disponibles"
            value={stats.available}
            tint="bg-[var(--color-olive)]/10 border-[var(--color-olive)]/20"
          />
          <StatCard
            icon={<XCircle className="w-4 h-4 text-[var(--color-taupe-light)]" />}
            label="Masqués"
            value={stats.unavailable}
            tint="bg-[var(--color-sand)] border-[var(--color-shell)]"
          />
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-4 md:p-5 shadow-md flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--color-taupe-light)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un produit, une description, une catégorie…"
            className="w-full pl-10 pr-3 py-2.5 bg-[var(--color-sand)]/60 border border-[var(--color-shell)] focus:border-[var(--color-olive)] focus:bg-[var(--color-cream)] rounded-xl text-sm text-[var(--color-wood)] placeholder-[var(--color-taupe-light)] outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-[var(--color-sand)] border border-[var(--color-shell)] rounded-xl p-1 shrink-0">
          {(['all', 'available', 'unavailable'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                filter === f
                  ? 'bg-[var(--color-olive)] text-[var(--color-cream)] shadow-sm shadow-[var(--color-olive)]/20'
                  : 'text-[var(--color-taupe)] hover:text-[var(--color-wood)]'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'available' ? 'Dispo' : 'Masqués'}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategorieFilter(null)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all cursor-pointer ${
              categorieFilter === null
                ? 'bg-[var(--color-olive)] text-[var(--color-cream)] border-[var(--color-olive)] shadow-md shadow-[var(--color-olive)]/20'
                : 'bg-[var(--color-cream)] text-[var(--color-taupe)] border-[var(--color-shell)] hover:text-[var(--color-wood)] hover:border-[var(--color-stone)]'
            }`}
          >
            <Layers className="w-3 h-3 inline mr-1 -mt-0.5" />
            Toutes catégories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorieFilter(cat)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all cursor-pointer ${
                categorieFilter === cat
                  ? 'bg-[var(--color-olive)] text-[var(--color-cream)] border-[var(--color-olive)] shadow-md shadow-[var(--color-olive)]/20'
                  : 'bg-[var(--color-cream)] text-[var(--color-taupe)] border-[var(--color-shell)] hover:text-[var(--color-wood)] hover:border-[var(--color-stone)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[var(--color-shell)] border-t-[var(--color-olive)] rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[var(--color-taupe)]">Chargement du catalogue…</p>
          </div>
        </div>
      ) : filteredProduits.length === 0 ? (
        <EmptyState
          hasAny={produits.length > 0}
          onAdd={() => setEditing('new')}
          onClearFilters={() => {
            setSearchTerm('');
            setFilter('all');
            setCategorieFilter(null);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProduits.map((p) => (
            <ProduitCard
              key={p.id}
              produit={p}
              onEdit={() => setEditing(p)}
              onToggle={() => handleToggleDisponibilite(p)}
              isToggling={togglingIds.has(p.id)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <ProduitForm
            commercantId={merchant.id}
            initial={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSave={handleSave}
            onDelete={editing !== 'new' ? handleDelete : undefined}
            isSubmitting={submitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className={`border rounded-2xl p-4 ${tint}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[9px] font-bold text-[var(--color-taupe)] uppercase tracking-[0.16em] font-mono">
          {label}
        </span>
      </div>
      <p className="font-display text-2xl font-extrabold text-[var(--color-wood)] tracking-tight font-mono">
        {value}
      </p>
    </div>
  );
}

function ProduitCard({
  produit,
  onEdit,
  onToggle,
  isToggling,
}: {
  produit: Produit;
  onEdit: () => void;
  onToggle: () => void;
  isToggling: boolean;
}) {
  return (
    <div
      className={`bg-[var(--color-cream)] border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all ${
        produit.disponible ? 'border-[var(--color-shell)]' : 'border-[var(--color-shell)] opacity-70'
      }`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {produit.categorie && (
              <span className="text-[9px] font-bold text-[var(--color-taupe-light)] uppercase tracking-wider font-mono flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                {produit.categorie}
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-sm text-[var(--color-wood)] tracking-tight truncate">
            {produit.nom}
          </h3>
          {produit.description && (
            <p className="text-[11px] text-[var(--color-taupe)] mt-1 line-clamp-2 leading-relaxed">
              {produit.description}
            </p>
          )}
        </div>

        <button
          onClick={onToggle}
          disabled={isToggling}
          title={produit.disponible ? 'Masquer du portail client' : 'Rendre disponible'}
          className={`shrink-0 relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
            produit.disponible ? 'bg-[var(--color-olive)]' : 'bg-[var(--color-stone)]'
          } ${isToggling ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-[var(--color-cream)] rounded-full transition-transform ${
              produit.disponible ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className="flex items-end justify-between pt-3 border-t border-[var(--color-shell)]/70">
        <div>
          <p className="font-display text-xl font-extrabold text-[var(--color-wood)] tracking-tight font-mono">
            {formatPrixCents(produit.prix_cents)}
          </p>
          {produit.unite && (
            <p className="text-[10px] text-[var(--color-taupe-light)] uppercase font-bold mt-0.5 font-mono">
              / {produit.unite}
            </p>
          )}
          {produit.stock !== null && produit.stock !== undefined && (
            <p className="text-[10px] text-[var(--color-taupe)] font-mono mt-1 flex items-center gap-1">
              <Inbox className="w-2.5 h-2.5" />
              Stock : {produit.stock}
            </p>
          )}
        </div>

        <button
          onClick={onEdit}
          className="px-3 py-2 text-[10px] font-bold uppercase rounded-xl bg-[var(--color-sand)] border border-[var(--color-shell)] hover:border-[var(--color-terracotta)] hover:bg-[var(--color-terracotta)]/10 text-[var(--color-wood-soft)] hover:text-[var(--color-terracotta)] transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Pencil className="w-3 h-3" />
          Modifier
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  hasAny,
  onAdd,
  onClearFilters,
}: {
  hasAny: boolean;
  onAdd: () => void;
  onClearFilters: () => void;
}) {
  if (!hasAny) {
    return (
      <div className="bg-[var(--color-cream)] border border-dashed border-[var(--color-shell)] rounded-3xl p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-sand)] border border-[var(--color-shell)] flex items-center justify-center text-[var(--color-olive)] mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-display font-extrabold text-[var(--color-wood)] tracking-tight uppercase">
          Votre catalogue est vide
        </h3>
        <p className="text-xs text-[var(--color-taupe)] mt-2 max-w-[340px] mx-auto leading-relaxed">
          Ajoutez votre premier produit pour qu'il apparaisse aux clients du marché.
          Vous pouvez ajuster les prix, la disponibilité et les stocks à tout moment.
        </p>
        <ShinyButton type="button" onClick={onAdd} className="mt-6 max-w-xs mx-auto bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] text-[var(--color-cream)] rounded-full font-semibold shadow-md shadow-[var(--color-olive)]/20">
          <Plus className="w-4 h-4 text-[var(--color-cream)]" />
          Ajouter mon premier produit
        </ShinyButton>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-8 text-center">
      <p className="text-xs text-[var(--color-taupe)] mb-4">
        Aucun produit ne correspond à vos filtres actuels.
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="px-4 py-2 text-[10px] font-bold uppercase rounded-xl bg-[var(--color-sand)] border border-[var(--color-shell)] hover:border-[var(--color-stone)] hover:bg-[var(--color-sand)]/80 text-[var(--color-wood-soft)] cursor-pointer"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
