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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-slate-300" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] font-mono">
                Catalogue produits
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-display font-extrabold text-white tracking-tight uppercase">
              Vos produits du moment
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Ajoutez, modifiez, et masquez ce qui n'est plus en stock. Les produits disponibles
              sont visibles depuis le portail client.
            </p>
          </div>

          <ShinyButton
            type="button"
            onClick={() => setEditing('new')}
            className="shrink-0"
            id="add-produit-btn"
          >
            <Plus className="w-4 h-4 text-white" />
            Ajouter un produit
          </ShinyButton>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard
            icon={<Package className="w-4 h-4 text-slate-300" />}
            label="Produits"
            value={stats.total}
            tint="bg-slate-950 border-slate-800"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            label="Disponibles"
            value={stats.available}
            tint="bg-emerald-500/8 border-emerald-500/20"
          />
          <StatCard
            icon={<XCircle className="w-4 h-4 text-slate-500" />}
            label="Masqués"
            value={stats.unavailable}
            tint="bg-slate-950 border-slate-800"
          />
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-5 shadow-md flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un produit, une description, une catégorie…"
            className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-850 focus:border-slate-400 focus:bg-slate-900 rounded-xl text-xs font-medium text-slate-100 placeholder-slate-650 outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
          {(['all', 'available', 'unavailable'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                filter === f
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
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
                ? 'bg-white text-slate-900 border-white'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
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
                  ? 'bg-white text-slate-900 border-white'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Chargement du catalogue…</p>
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
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.16em] font-mono">
          {label}
        </span>
      </div>
      <p className="font-display text-2xl font-extrabold text-white tracking-tight font-mono">
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
      className={`bg-slate-900 border rounded-3xl p-5 shadow-md transition-all ${
        produit.disponible ? 'border-slate-800' : 'border-slate-850 opacity-70'
      }`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {produit.categorie && (
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                {produit.categorie}
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-sm text-slate-100 tracking-tight truncate">
            {produit.nom}
          </h3>
          {produit.description && (
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {produit.description}
            </p>
          )}
        </div>

        <button
          onClick={onToggle}
          disabled={isToggling}
          title={produit.disponible ? 'Masquer du portail client' : 'Rendre disponible'}
          className={`shrink-0 relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
            produit.disponible ? 'bg-emerald-500' : 'bg-slate-700'
          } ${isToggling ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              produit.disponible ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className="flex items-end justify-between pt-3 border-t border-slate-800/70">
        <div>
          <p className="font-display text-xl font-extrabold text-white tracking-tight font-mono">
            {formatPrixCents(produit.prix_cents)}
          </p>
          {produit.unite && (
            <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5 font-mono">
              / {produit.unite}
            </p>
          )}
          {produit.stock !== null && produit.stock !== undefined && (
            <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
              <Inbox className="w-2.5 h-2.5" />
              Stock : {produit.stock}
            </p>
          )}
        </div>

        <button
          onClick={onEdit}
          className="px-3 py-2 text-[10px] font-bold uppercase rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
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
      <div className="bg-slate-900 border border-slate-800 border-dashed rounded-3xl p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-display font-extrabold text-white tracking-tight uppercase">
          Votre catalogue est vide
        </h3>
        <p className="text-xs text-slate-400 mt-2 max-w-[340px] mx-auto leading-relaxed">
          Ajoutez votre premier produit pour qu'il apparaisse aux clients du marché.
          Vous pouvez ajuster les prix, la disponibilité et les stocks à tout moment.
        </p>
        <ShinyButton type="button" onClick={onAdd} className="mt-6 max-w-xs mx-auto">
          <Plus className="w-4 h-4 text-white" />
          Ajouter mon premier produit
        </ShinyButton>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
      <p className="text-xs text-slate-400 mb-4">
        Aucun produit ne correspond à vos filtres actuels.
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="px-4 py-2 text-[10px] font-bold uppercase rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 cursor-pointer"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
