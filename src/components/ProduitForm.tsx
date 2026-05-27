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
    <div className="fixed inset-0 bg-[var(--color-wood)]/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-[var(--color-cream)] border-b border-[var(--color-shell)] px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-base font-display font-extrabold text-[var(--color-wood)] uppercase tracking-tight">
              {initial ? 'Modifier un produit' : 'Nouveau produit'}
            </h2>
            <p className="text-[10px] text-[var(--color-taupe)] font-mono mt-0.5">
              Catalogue de votre enseigne
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-xl bg-[var(--color-sand)] border border-[var(--color-shell)] hover:bg-[var(--color-sand)] text-[var(--color-taupe)] flex items-center justify-center transition-colors cursor-pointer"
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
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--color-taupe-light)] font-mono pointer-events-none">
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

          <div className="flex items-center justify-between p-3 bg-[var(--color-sand)] border border-[var(--color-shell)] rounded-2xl">
            <div>
              <p className="text-xs font-bold text-[var(--color-wood)]">Disponible à la vente</p>
              <p className="text-[10px] text-[var(--color-taupe)] mt-0.5">
                Si désactivé, le produit n'apparaît pas dans le portail client.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDisponible(!disponible)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                disponible ? 'bg-[var(--color-olive)]' : 'bg-[var(--color-shell)]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-[var(--color-cream)] rounded-full transition-transform ${
                  disponible ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-shell)]/70">
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
                    ? 'bg-[var(--color-paprika)] hover:bg-[var(--color-paprika)] text-[var(--color-cream)]'
                    : 'bg-[var(--color-sand)] border border-[var(--color-shell)] hover:border-[var(--color-paprika)] text-[var(--color-paprika)] hover:text-[var(--color-paprika)]'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmDelete ? 'Confirmer suppression' : 'Supprimer'}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-sand)] border border-[var(--color-shell)] hover:bg-[var(--color-sand)] text-[var(--color-wood-soft)] cursor-pointer"
            >
              Annuler
            </button>
            <ShinyButton type="submit" disabled={isSubmitting} className="flex-1 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] text-[var(--color-cream)] rounded-full font-semibold shadow-md shadow-[var(--color-olive)]/20">
              <Save className="w-3.5 h-3.5 text-[var(--color-cream)]" />
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
      <label className="block text-[10px] font-bold text-[var(--color-taupe)] uppercase tracking-wider mb-1.5 font-mono">
        {label}
        {required && <span className="text-[var(--color-paprika)] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 bg-[var(--color-sand)]/60 border border-[var(--color-shell)] focus:border-[var(--color-olive)] focus:bg-[var(--color-cream)] rounded-xl text-sm font-medium text-[var(--color-wood)] placeholder-[var(--color-taupe-light)] outline-none transition-colors';
