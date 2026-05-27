import { Link, NavLink, useLocation } from 'react-router-dom';
import { LogOut, ShoppingBasket, Store, ScrollText, Home } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

export function UserHeader() {
  const { profile, user, signOut } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();

  const displayName = profile?.nom || user?.email?.split('@')[0] || 'Client';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Hide cart badge on the cart page itself to avoid visual redundancy
  const showCart = location.pathname !== '/panier';

  return (
    <header className="border-b border-[var(--color-shell)]/70 bg-[var(--color-cream)]/85 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <Logo to="/mon-compte" />

        <nav className="hidden md:flex items-center gap-1">
          <NavItem to="/mon-compte" icon={<Home className="w-3.5 h-3.5" />} label="Accueil" />
          <NavItem to="/commercants" icon={<Store className="w-3.5 h-3.5" />} label="Commerçants" />
          <NavItem to="/commandes" icon={<ScrollText className="w-3.5 h-3.5" />} label="Mes commandes" />
        </nav>

        <div className="flex items-center gap-2.5">
          {showCart && (
            <Link
              to="/panier"
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-shell)]/60 hover:bg-[var(--color-shell)] text-[var(--color-wood-soft)] transition-colors"
              aria-label="Panier"
            >
              <ShoppingBasket className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[var(--color-terracotta)] text-[var(--color-cream)] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[var(--color-shell)]">
            <div className="w-9 h-9 rounded-full bg-[var(--color-olive)] text-[var(--color-cream)] flex items-center justify-center font-display font-semibold text-sm shrink-0">
              {initials || '·'}
            </div>
            <div className="leading-tight max-w-[140px]">
              <p className="text-xs font-semibold text-[var(--color-wood)] truncate">
                {displayName}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-taupe)] font-medium">
                Connecté
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--color-wood-soft)] hover:text-[var(--color-paprika)] bg-[var(--color-shell)]/40 hover:bg-[var(--color-shell)] rounded-full transition-colors cursor-pointer"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-[var(--color-shell)]/60 px-2 py-2">
        <NavItem to="/mon-compte" icon={<Home className="w-3.5 h-3.5" />} label="Accueil" />
        <NavItem to="/commercants" icon={<Store className="w-3.5 h-3.5" />} label="Marché" />
        <NavItem to="/commandes" icon={<ScrollText className="w-3.5 h-3.5" />} label="Commandes" />
      </nav>
    </header>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
          isActive
            ? 'bg-[var(--color-olive)] text-[var(--color-cream)]'
            : 'text-[var(--color-wood-soft)] hover:bg-[var(--color-shell)]/60'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
