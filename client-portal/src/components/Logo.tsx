import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 group">
      <div className="w-11 h-11 rounded-2xl bg-[var(--color-olive)] flex items-center justify-center shadow-sm group-hover:bg-[var(--color-olive-dark)] transition-colors">
        <Leaf className="w-5 h-5 text-[var(--color-cream)]" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-lg font-semibold text-[var(--color-wood)]">
          Marché de Saint-Cyprien
        </p>
        <p className="text-[11px] text-[var(--color-taupe)] uppercase tracking-[0.18em] font-medium">
          Portail client · Plein vent
        </p>
      </div>
    </Link>
  );
}
