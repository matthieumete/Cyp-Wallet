import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { AuthHeader, ConfigWarning, ErrorBanner, Field, inputCls } from './SignUp';

export default function Login() {
  const { signIn, user, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/mon-compte';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signIn(email, password);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <AuthHeader />

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-sage)]/15 border border-[var(--color-sage)]/30 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--color-olive-deep)] mb-4">
              <LogIn className="w-3 h-3" />
              Connexion
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-wood)]">
              Heureux de vous revoir.
            </h1>
            <p className="text-sm text-[var(--color-taupe)] mt-2">
              Connectez-vous pour retrouver vos commerçants et vos points fidélité.
            </p>
          </div>

          {!isConfigured && <ConfigWarning />}

          <form
            onSubmit={handleSubmit}
            className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-6 md:p-7 shadow-sm space-y-4"
          >
            <Field label="Email" icon={<Mail className="w-4 h-4" />} required>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className={inputCls}
              />
            </Field>

            <Field label="Mot de passe" icon={<Lock className="w-4 h-4" />} required>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className={inputCls}
              />
            </Field>

            {error && <ErrorBanner message={error} />}

            <button
              type="submit"
              disabled={submitting || !isConfigured}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-cream)] rounded-full text-sm font-semibold shadow-md shadow-[var(--color-olive)]/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-center text-xs text-[var(--color-taupe)] pt-3 border-t border-[var(--color-shell)]/70">
              Pas encore de compte ?{' '}
              <Link
                to="/inscription"
                className="font-semibold text-[var(--color-terracotta-dark)] hover:text-[var(--color-paprika)]"
              >
                Créez-en un gratuitement
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
