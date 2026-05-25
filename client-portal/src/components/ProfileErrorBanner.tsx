import { useState } from 'react';
import { AlertTriangle, RotateCw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth';

export function ProfileErrorBanner() {
  const { profileError, retryProfile, user } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!profileError) return null;

  const handleRetry = async () => {
    setRetrying(true);
    await retryProfile();
    setRetrying(false);
  };

  return (
    <div className="bg-[var(--color-paprika)]/8 border border-[var(--color-paprika)]/30 rounded-3xl p-5 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-paprika)]/15 text-[var(--color-paprika)] flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-wood)]">
            Votre fiche client n'a pas pu être chargée
          </p>
          <p className="text-xs text-[var(--color-wood-soft)] mt-1 leading-relaxed">
            {profileError}
          </p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] disabled:opacity-50 text-[var(--color-cream)] rounded-full text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Nouvel essai…' : 'Réessayer'}
            </button>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-[var(--color-wood-soft)] hover:bg-[var(--color-shell)]/60 rounded-full transition-colors cursor-pointer"
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDetails ? 'Masquer les détails' : 'Voir les détails'}
            </button>
          </div>

          {showDetails && (
            <div className="mt-4 p-3 bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-xl text-[11px] text-[var(--color-wood-soft)] space-y-2">
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--color-taupe)]">
                  Email
                </span>
                <p className="font-mono">{user?.email ?? '—'}</p>
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--color-taupe)]">
                  Auth user ID
                </span>
                <p className="font-mono break-all">{user?.id ?? '—'}</p>
              </div>
              <div className="pt-2 border-t border-[var(--color-shell)]">
                <p className="font-semibold text-[var(--color-wood)] mb-1">
                  Causes courantes
                </p>
                <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
                  <li>Le SQL de l'étape 2 n'a pas été exécuté sur ce projet Supabase</li>
                  <li>RLS bloque la création (vérifiez les policies sur clients_saint_cyp)</li>
                  <li>Une fiche existe déjà avec votre email — supprimez-la dans Table Editor</li>
                </ul>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[var(--color-olive-dark)] hover:text-[var(--color-olive-deep)] font-semibold"
                >
                  Ouvrir Supabase
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
