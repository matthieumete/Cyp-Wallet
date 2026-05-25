import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Send,
  AlertCircle,
  ShoppingBasket,
  Store,
} from 'lucide-react';
import type { Commercant } from '@shared/types';
import { formatPrixCents } from '@shared/types';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { getMerchant, placeOrder } from '../lib/db';
import { getNextMarketSlots, MarketSlot } from '../lib/marketSlots';
import { UserHeader } from '../components/UserHeader';

export default function Cart() {
  const { cart, itemCount, totalCents, setQuantity, removeItem, clear } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [merchant, setMerchant] = useState<Commercant | null>(null);
  const [slots] = useState<MarketSlot[]>(() => getNextMarketSlots(6));
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slots.length > 0 && !selectedSlot) {
      setSelectedSlot(slots[0].iso);
    }
  }, [slots]);

  useEffect(() => {
    if (!cart.commercantId) {
      setMerchant(null);
      return;
    }
    getMerchant(cart.commercantId).then(setMerchant).catch(() => setMerchant(null));
  }, [cart.commercantId]);

  const handleSubmit = async () => {
    if (!profile) {
      setError('Profil client introuvable. Veuillez vous reconnecter.');
      return;
    }
    if (!cart.commercantId || cart.items.length === 0) return;
    if (!selectedSlot) {
      setError('Veuillez choisir un créneau de retrait.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await placeOrder({
      passId: profile.id_pass_wallet,
      commercantId: cart.commercantId,
      items: cart.items,
      creneauRetrait: selectedSlot,
      noteClient: note.trim() || undefined,
    });
    setSubmitting(false);

    if (res.error || !res.commande) {
      setError(res.error ?? 'Une erreur est survenue.');
      return;
    }
    clear();
    navigate(`/commandes/${res.commande.id}`, { replace: true });
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-paper">
        <UserHeader />
        <main className="max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-shell)]/60 flex items-center justify-center mb-5">
            <ShoppingBasket className="w-6 h-6 text-[var(--color-taupe)]" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-wood)]">
            Votre panier est vide.
          </h1>
          <p className="text-sm text-[var(--color-taupe)] mt-2">
            Parcourez les commerçants du marché pour ajouter vos produits du moment.
          </p>
          <Link
            to="/commercants"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] text-[var(--color-cream)] rounded-full text-sm font-semibold transition-colors"
          >
            <Store className="w-4 h-4" />
            Découvrir le marché
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <UserHeader />

      <main className="max-w-3xl mx-auto px-6 py-8 md:py-12">
        <Link
          to={`/commercants/${cart.commercantId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-taupe)] hover:text-[var(--color-wood)] mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Continuer mes achats
        </Link>

        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-olive-dark)] font-semibold mb-1">
            <ShoppingBasket className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Mon panier
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-wood)] tracking-tight">
            Validation de votre commande
          </h1>
          {merchant && (
            <p className="text-sm text-[var(--color-taupe)] mt-2">
              Auprès de{' '}
              <strong className="text-[var(--color-wood)]">{merchant.nom_enseigne}</strong>
            </p>
          )}
        </header>

        {/* Items */}
        <section className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-5 shadow-sm mb-5">
          <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-taupe)] font-semibold mb-4">
            Articles ({itemCount})
          </h2>
          <div className="divide-y divide-[var(--color-shell)]/70">
            {cart.items.map((it) => (
              <div key={it.produit.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-wood)] truncate">
                    {it.produit.nom}
                  </p>
                  <p className="text-[11px] text-[var(--color-taupe)] mt-0.5 font-mono">
                    {formatPrixCents(it.produit.prix_cents)}
                    {it.produit.unite ? ` / ${it.produit.unite}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-[var(--color-sand)]/60 border border-[var(--color-shell)] rounded-full p-1">
                  <button
                    onClick={() => setQuantity(it.produit.id, it.quantite - 1)}
                    className="w-7 h-7 rounded-full bg-[var(--color-cream)] hover:bg-[var(--color-shell)] text-[var(--color-wood)] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Diminuer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="min-w-[28px] text-center text-sm font-bold font-mono text-[var(--color-wood)]">
                    {it.quantite}
                  </span>
                  <button
                    onClick={() => setQuantity(it.produit.id, it.quantite + 1)}
                    className="w-7 h-7 rounded-full bg-[var(--color-cream)] hover:bg-[var(--color-shell)] text-[var(--color-wood)] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Augmenter"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right min-w-[64px]">
                  <p className="text-sm font-display font-semibold text-[var(--color-wood)]">
                    {formatPrixCents(it.produit.prix_cents * it.quantite)}
                  </p>
                </div>

                <button
                  onClick={() => removeItem(it.produit.id)}
                  className="w-8 h-8 rounded-full text-[var(--color-taupe)] hover:text-[var(--color-paprika)] hover:bg-[var(--color-paprika)]/10 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Retirer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Pickup slot */}
        <section className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-5 shadow-sm mb-5">
          <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-taupe)] font-semibold mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-olive)]" />
            Créneau de retrait
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {slots.map((s) => (
              <button
                key={s.iso}
                type="button"
                onClick={() => setSelectedSlot(s.iso)}
                className={`text-left px-3.5 py-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                  selectedSlot === s.iso
                    ? 'bg-[var(--color-olive)] text-[var(--color-cream)] border-[var(--color-olive)] font-semibold'
                    : 'bg-[var(--color-sand)]/40 text-[var(--color-wood-soft)] border-[var(--color-shell)] hover:border-[var(--color-stone)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {/* Note */}
        <section className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-5 shadow-sm mb-5">
          <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-taupe)] font-semibold mb-2">
            Note pour le commerçant (optionnel)
          </h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ex: bien cuit / sans gluten / autre demande…"
            className="w-full px-3.5 py-2.5 bg-[var(--color-sand)]/60 border border-[var(--color-shell)] focus:border-[var(--color-olive)] focus:bg-[var(--color-cream)] rounded-xl text-xs font-medium text-[var(--color-wood)] placeholder-[var(--color-taupe-light)] outline-none resize-none"
          />
        </section>

        {/* Total + submit */}
        <section className="bg-[var(--color-wood)] text-[var(--color-cream)] rounded-3xl p-6 shadow-xl shadow-[var(--color-wood)]/15">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] uppercase tracking-[0.2em] opacity-70 font-semibold">
              Total à payer en boutique
            </span>
            <span className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              {formatPrixCents(totalCents)}
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-[var(--color-paprika)]/20 border border-[var(--color-paprika)]/40 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedSlot}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-terracotta)] hover:bg-[var(--color-terracotta-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-cream)] rounded-full text-sm font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Envoi de la commande…' : 'Valider la commande'}
          </button>

          <p className="text-[10px] text-[var(--color-cream)]/70 text-center mt-3 leading-relaxed">
            Vous paierez directement au commerçant lors du retrait sur le marché.
          </p>
        </section>
      </main>
    </div>
  );
}
