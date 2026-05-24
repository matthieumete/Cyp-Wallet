import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { Leaf } from 'lucide-react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-[var(--color-olive)] flex items-center justify-center animate-pulse">
        <Leaf className="w-6 h-6 text-[var(--color-cream)]" />
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-taupe)] font-semibold">
        Chargement du portail…
      </p>
    </div>
  );
}
