import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingBasket,
  CheckCircle2,
  Tag,
  Award,
} from 'lucide-react';
import type { Commercant, Produit } from '@shared/types';
import { formatPrixCents } from '@shared/types';
import { getMerchant, listProduitsAvailable } from '../lib/db';
import { useCart } from '../lib/cart';
import { UserHeader } from '../components/UserHeader';
import { LoadingScreen } from '../components/ProtectedRoute';

export default function MerchantDetail() {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<Commercant | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [m, p] = await Promise.all([getMerchant(id), listProduitsAvailable(id)]);
        setMerchant(m);
        setProduits(p);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    produits.forEach((p) => p.categorie && set.add(p.categorie));
    return Array.from(set).sort();
  }, [produits]);

  const filtered = useMemo(() => {
    if (!activeCategory) return produits;
    return produits.filter((p) => p.categorie === activeCategory);
  }, [produits, activeCategory]);

  if (loading) return <LoadingScreen />;
  if (error)
    return (
      <ErrorScreen message={`Erreur lors du chargement : ${error}`} />
    );
  if (!merchant) return <ErrorScreen message="Commerçant introuvable." />;

  return (
    <div className="min-h-screen bg-paper">
      <UserHeader />

      <main className="max-w-6xl mx-auto px-6 py-8 md:py-12">
        <Link
          to="/commercants"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-taupe)] hover:text-[var(--color-wood)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Tous les commerçants
        </Link>

        <header className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-6 md:p-8 shadow-sm mb-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl bg-gradient-to-br from-[var(--color-olive)] to-[var(--color-moss)] text-[var(--color-cream)] font-display font-semibold text-xl md:text-2xl flex items-center justify-center shadow-sm">
              {merchant.nom_enseigne
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-olive-dark)] font-semibold mb-1">
                Artisan du marché
              </p>
              <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-wood)]">
                {merchant.nom_enseigne}
              </h1>
              <div className="flex items-center gap-2 mt-3 text-[11px] text-[var(--color-taupe)]">
                <Award className="w-3.5 h-3.5 text-[var(--color-straw)]" />
                <span>
                  Remise débloquée à <strong className="text-[var(--color-wood)] font-mono">{merchant.seuil_remise_pts} points</strong>
                </span>
              </div>
            </div>
          </div>
        </header>

        {categories.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all cursor-pointer ${
                activeCategory === null
                  ? 'bg-[var(--color-olive)] text-[var(--color-cream)] border-[var(--color-olive)]'
                  : 'bg-[var(--color-cream)] text-[var(--color-wood-soft)] border-[var(--color-shell)] hover:border-[var(--color-stone)]'
              }`}
            >
              Toutes
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all cursor-pointer ${
                  activeCategory === c
                    ? 'bg-[var(--color-olive)] text-[var(--color-cream)] border-[var(--color-olive)]'
                    : 'bg-[var(--color-cream)] text-[var(--color-wood-soft)] border-[var(--color-shell)] hover:border-[var(--color-stone)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-[var(--color-cream)] border border-dashed border-[var(--color-shell)] rounded-3xl p-10 text-center">
            <p className="text-sm text-[var(--color-taupe)]">
              {produits.length === 0
                ? "Ce commerçant n'a pas encore mis de produits en ligne."
                : 'Aucun produit dans cette catégorie.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProduitCard key={p.id} produit={p} />
            ))}
          </div>
        )}
      </main>

      <CartSummary commercantId={merchant.id} />
    </div>
  );
}

function ProduitCard({ produit }: { produit: Produit }) {
  const { cart, addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const inCart = cart.items.find((it) => it.produit.id === produit.id)?.quantite ?? 0;

  const handleAdd = () => {
    const res = addItem(produit, 1);
    if (res.switched) {
      alert(
        'Votre panier contenait des produits d\'un autre commerçant. Il a été remplacé.'
      );
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-5 shadow-sm flex flex-col">
      {produit.categorie && (
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-taupe)] flex items-center gap-1 mb-2">
          <Tag className="w-2.5 h-2.5" />
          {produit.categorie}
        </span>
      )}

      <h3 className="font-display text-base font-semibold text-[var(--color-wood)] tracking-tight">
        {produit.nom}
      </h3>

      {produit.description && (
        <p className="text-[11px] text-[var(--color-taupe)] mt-1 leading-relaxed line-clamp-3">
          {produit.description}
        </p>
      )}

      <div className="mt-auto pt-4 flex items-end justify-between">
        <div>
          <p className="font-display text-xl font-semibold text-[var(--color-wood)] tracking-tight">
            {formatPrixCents(produit.prix_cents)}
          </p>
          {produit.unite && (
            <p className="text-[10px] uppercase font-bold text-[var(--color-taupe)] mt-0.5 font-mono">
              / {produit.unite}
            </p>
          )}
        </div>

        <button
          onClick={handleAdd}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
            justAdded
              ? 'bg-[var(--color-olive)] text-[var(--color-cream)]'
              : 'bg-[var(--color-terracotta)] hover:bg-[var(--color-terracotta-dark)] text-[var(--color-cream)]'
          }`}
        >
          {justAdded ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ajouté
            </>
          ) : inCart > 0 ? (
            <>
              <Plus className="w-3.5 h-3.5" />
              {inCart} au panier
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CartSummary({ commercantId }: { commercantId: string }) {
  const { cart, itemCount, totalCents } = useCart();
  const navigate = useNavigate();
  const sameMerchant = cart.commercantId === commercantId;

  if (itemCount === 0 || !sameMerchant) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-30">
      <button
        onClick={() => navigate('/panier')}
        className="w-full bg-[var(--color-wood)] hover:bg-[var(--color-wood-soft)] text-[var(--color-cream)] rounded-2xl p-4 shadow-xl shadow-[var(--color-wood)]/20 flex items-center justify-between transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-cream)]/15 flex items-center justify-center">
            <ShoppingBasket className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wider opacity-75 font-semibold">
              Mon panier
            </p>
            <p className="text-sm font-display font-semibold">
              {itemCount} article{itemCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <p className="font-display text-base font-semibold">
          {formatPrixCents(totalCents)}
        </p>
      </button>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-paper">
      <UserHeader />
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-sm text-[var(--color-paprika)]">{message}</p>
        <Link
          to="/commercants"
          className="inline-block mt-4 text-xs font-semibold text-[var(--color-olive-dark)] underline"
        >
          Retour à la liste des commerçants
        </Link>
      </main>
    </div>
  );
}
