import { FormEvent, useState, useEffect, ReactNode } from 'react';
import { motion } from 'motion/react';
import { X, Save, Trash2 } from 'lucide-react';
import { Produit } from '../types';
import { ShinyButton } from './ui/shiny-button';

interface ProduitFormProps {
  commercantId: string;
  initial: Produit | null;
  onCancel: () => void;
  onSave: (
    fields: Omit<Produit, 'id' | 'date_creation' | 'date_modification'>
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
  isSubmitting: boolean;
}

const UNITES = ['pièce', 'kg', 'g', 'L', 'cL', 'botte', 'barquette', 'tasse', 'verre', 'formule'];

export default function ProduitForm({
  commercantId,
  initial,
  onCancel,
  onSave,
  onDelete,
  isSubmitting,
}: ProduitFormProps) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prixEuros, setPrixEuros] = useState('');
  const [unite, setUnite] = useState('pièce');
  const [categorie, setCategorie] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (initial) {
      setNom(initial.nom);
      setDescription(initial.description || '');
      setPrixEuros((initial.prix_cents / 100).toFixed(2).replace(/\.?0+$/, ''));
      setUnite(initial.unite || 'pièce');
      setCategorie(initial.categorie || '');
      setStock(initial.stock === null || initial.stock === undefined ? '' : String(initial.stock));
      setImageUrl(initial.image_url || '');
      setDisponible(initial.disponible);
    } else {
      setNom('');
      setDescription('');
      setPrixEuros('');
      setUnite('pièce');
      setCategorie('');
      setStock('');
      setImageUrl('');
      setDisponible(true);
    }
    setConfirmDelete(false);
  }, [initial]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const prix = parseFloat(prixEuros.replace(',', '.'));
    if (!nom.trim()) {
      alert('Le nom du produit est obligatoire.');
      return;
    }
    if (isNaN(prix) || prix < 0) {
      alert('Le prix doit être un nombre positif.');
      return;
    }

    await onSave({
      commercant_id: commercantId,
      nom: nom.trim(),
      description: description.trim() || null,
      prix_cents: Math.round(prix * 100),
      unite: unite || null,
      categorie: categorie.trim() || null,
      image_url: imageUrl.trim() || null,
      stock: stock.trim() === '' ? null : Math.max(0, parseInt(stock)),
      disponible,
      position: initial?.position ?? 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-base font-display font-extrabold text-white uppercase tracking-tight">
              {initial ? 'Modifier un produit' : 'Nouveau produit'}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Catalogue de votre enseigne
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Nom du produit" required>
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Baguette tradition"
              className={inputCls}
            />
          </Field>

          <Field label="Description courte">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quelques mots qui donnent envie au client…"
              rows={2}
              className={inputCls + ' resize-none'}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix (€)" required>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={prixEuros}
                  onChange={(e) => setPrixEuros(e.target.value)}
                  placeholder="1.20"
                  className={inputCls + ' pr-8'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 font-mono pointer-events-none">
                  €
                </span>
              </div>
            </Field>

            <Field label="Unité">
              <select
                value={unite}
                onChange={(e) => setUnite(e.target.value)}
                className={inputCls}
              >
                {UNITES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <input
                type="text"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                placeholder="Pain, Viennoiserie…"
                className={inputCls}
              />
            </Field>

            <Field label="Stock (optionnel)">
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Illimité"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="URL d'image (optionnel)">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
          </Field>

          <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-slate-100">Disponible à la vente</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Si désactivé, le produit n'apparaît pas dans le portail client.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDisponible(!disponible)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                disponible ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  disponible ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-800/70">
            {initial && onDelete && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    setTimeout(() => setConfirmDelete(false), 3000);
                    return;
                  }
                  await onDelete();
                }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  confirmDelete
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-slate-950 border border-slate-800 hover:border-red-800 text-red-400 hover:text-red-300'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmDelete ? 'Confirmer suppression' : 'Supprimer'}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              Annuler
            </button>
            <ShinyButton type="submit" disabled={isSubmitting} className="flex-1">
              <Save className="w-3.5 h-3.5 text-white" />
              {isSubmitting ? 'Enregistrement…' : initial ? 'Enregistrer les modifications' : 'Créer le produit'}
            </ShinyButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
        {label}
        {required && <span className="text-white ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 focus:border-slate-400 focus:bg-slate-900 rounded-xl text-xs font-semibold outline-none text-slate-100 placeholder-slate-650';
