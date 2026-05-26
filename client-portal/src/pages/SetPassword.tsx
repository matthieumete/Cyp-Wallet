import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, KeyRound, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  AuthHeader,
  ConfigWarning,
  ErrorBanner,
  Field,
  inputCls,
} from './SignUp';

export default function SetPassword() {
  const { user, loading, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Si le SDK auth charge encore, on attend avant de décider d'une redirection.
  if (loading) return null;

  // Pas connecté = l'utilisateur n'a pas cliqué sur le magic link ou la session
  // a expiré. On l'envoie sur la connexion classique.
  if (!user) return <Navigate to="/connexion" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => navigate('/mon-compte', { replace: true }), 1200);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <AuthHeader />

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {done ? (
            <PasswordCreated />
          ) : (
            <>
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-sage)]/15 border border-[var(--color-sage)]/30 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--color-olive-deep)] mb-4">
                  <KeyRound className="w-3 h-3" />
                  Première connexion
                </span>
                <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-wood)]">
                  Définissez votre mot de passe.
                </h1>
                <p className="text-sm text-[var(--color-taupe)] mt-2">
                  Bienvenue {user.email ? <strong className="text-[var(--color-wood)]">{user.email}</strong> : null}. Choisissez un mot de passe pour sécuriser votre compte.
                </p>
              </div>

              {!isConfigured && <ConfigWarning />}

              <form
                onSubmit={handleSubmit}
                className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-6 md:p-7 shadow-sm space-y-4"
              >
                <Field label="Nouveau mot de passe" icon={<Lock className="w-4 h-4" />} required>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                    className={inputCls}
                  />
                </Field>

                <Field label="Confirmer le mot de passe" icon={<Lock className="w-4 h-4" />} required>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Retapez le mot de passe"
                    className={inputCls}
                  />
                </Field>

                {error && <ErrorBanner message={error} />}

                <button
                  type="submit"
                  disabled={submitting || !isConfigured}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-cream)] rounded-full text-sm font-semibold shadow-md shadow-[var(--color-olive)]/20 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {submitting ? 'Enregistrement…' : 'Définir mon mot de passe'}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function PasswordCreated() {
  return (
    <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-8 shadow-sm text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-olive)]/15 border border-[var(--color-olive)]/30 flex items-center justify-center mb-5">
        <CheckCircle2 className="w-7 h-7 text-[var(--color-olive-dark)]" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-[var(--color-wood)] mb-2">
        Mot de passe enregistré.
      </h2>
      <p className="text-sm text-[var(--color-taupe)] leading-relaxed">
        Redirection vers votre portail…
      </p>
    </div>
  );
}
