import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, ArrowRight, MapPin, Sun } from 'lucide-react';
import type { Commercant } from '@shared/types';
import { listMerchants, listCategoriesByMerchant } from '../lib/db';
import { UserHeader } from '../components/UserHeader';
import { LoadingScreen } from '../components/ProtectedRoute';

export default function Merchants() {
  const [merchants, setMerchants] = useState<Commercant[]>([]);
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, c] = await Promise.all([listMerchants(), listCategoriesByMerchant()]);
        setMerchants(m);
        setCategories(c);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-paper">
      <UserHeader />

      <main className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        <header className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-olive-dark)] font-semibold mb-2">
            <Store className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Vos artisans
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-wood)]">
            Les commerçants du marché.
          </h1>
          <p className="text-sm text-[var(--color-taupe)] mt-2 max-w-2xl">
            Découvrez les artisans du marché de Saint-Cyprien et commandez leurs produits du moment.
          </p>
          <div className="flex items-center gap-5 mt-4 text-xs text-[var(--color-taupe)]">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-olive)]" />
              Place du marché
            </span>
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[var(--color-straw)]" />
              Mardi · Jeudi · Samedi · 8h – 13h
            </span>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-[var(--color-paprika)]/10 border border-[var(--color-paprika)]/30 rounded-2xl text-xs text-[var(--color-paprika)]">
            Erreur lors du chargement : {error}
          </div>
        )}

        {merchants.length === 0 ? (
          <EmptyMerchants />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {merchants.map((m) => (
              <MerchantCard
                key={m.id}
                merchant={m}
                categories={categories[m.id] ?? []}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MerchantCard({
  merchant,
  categories,
}: {
  merchant: Commercant;
  categories: string[];
}) {
  const initials = merchant.nom_enseigne
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Link
      to={`/commercants/${merchant.id}`}
      className="group block bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-olive)] to-[var(--color-moss)] text-[var(--color-cream)] font-display font-semibold text-lg flex items-center justify-center shadow-sm">
          {initials}
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-taupe)] font-semibold bg-[var(--color-shell)]/60 px-2.5 py-1 rounded-full font-mono">
          {merchant.seuil_remise_pts} pts
        </span>
      </div>

      <h3 className="font-display text-lg font-semibold text-[var(--color-wood)] tracking-tight mb-2 group-hover:text-[var(--color-olive-dark)] transition-colors">
        {merchant.nom_enseigne}
      </h3>

      {categories.length > 0 ? (
        <div className="flex items-center gap-1.5 flex-wrap mb-5">
          {categories.slice(0, 4).map((c) => (
            <span
              key={c}
              className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-wood-soft)] bg-[var(--color-sand)]/80 border border-[var(--color-shell)] px-2 py-0.5 rounded-full"
            >
              {c}
            </span>
          ))}
          {categories.length > 4 && (
            <span className="text-[10px] text-[var(--color-taupe)]">
              +{categories.length - 4}
            </span>
          )}
        </div>
      ) : (
        <p className="text-[11px] italic text-[var(--color-taupe)] mb-5">
          Pas encore de produits en ligne.
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-shell)]/70 text-xs font-semibold text-[var(--color-olive-dark)] group-hover:text-[var(--color-olive-deep)]">
        Voir le catalogue
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

function EmptyMerchants() {
  return (
    <div className="bg-[var(--color-cream)] border border-dashed border-[var(--color-shell)] rounded-3xl p-12 text-center">
      <p className="text-sm text-[var(--color-taupe)]">
        Aucun commerçant n'est référencé pour le moment.
      </p>
    </div>
  );
}
