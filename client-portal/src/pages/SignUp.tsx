import { FormEvent, useState, ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../lib/auth';

export default function SignUp() {
  const { signUp, user, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  if (user) return <Navigate to="/mon-compte" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nom.trim()) return setError('Veuillez indiquer votre nom.');
    if (!email.trim()) return setError('Veuillez indiquer votre email.');
    if (password.length < 6)
      return setError('Le mot de passe doit faire au moins 6 caractères.');

    setSubmitting(true);
    const res = await signUp({ nom, email, password, telephone });
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.needsConfirmation) {
      setNeedsConfirmation(true);
      return;
    }
    navigate('/mon-compte', { replace: true });
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <AuthHeader />

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {needsConfirmation ? (
            <ConfirmationSent email={email} />
          ) : (
            <>
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-sage)]/15 border border-[var(--color-sage)]/30 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--color-olive-deep)] mb-4">
                  <Sparkles className="w-3 h-3" />
                  Inscription
                </span>
                <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-wood)]">
                  Bienvenue au marché.
                </h1>
                <p className="text-sm text-[var(--color-taupe)] mt-2">
                  Créez votre compte en 30 secondes pour commander et suivre vos points.
                </p>
              </div>

              {!isConfigured && <ConfigWarning />}

              <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-6 md:p-7 shadow-sm">
                <GoogleButton label="S'inscrire avec Google" onError={setError} />
                <AuthDivider />
                <form onSubmit={handleSubmit} className="space-y-4">
                <Field
                  label="Nom complet"
                  icon={<User className="w-4 h-4" />}
                  required
                >
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Jean Dupont"
                    className={inputCls}
                  />
                </Field>

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

                <Field label="Téléphone (optionnel)" icon={<Phone className="w-4 h-4" />}>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className={inputCls}
                  />
                </Field>

                <Field label="Mot de passe" icon={<Lock className="w-4 h-4" />} required>
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

                {error && <ErrorBanner message={error} />}

                <button
                  type="submit"
                  disabled={submitting || !isConfigured}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-terracotta)] hover:bg-[var(--color-terracotta-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-cream)] rounded-full text-sm font-semibold shadow-md shadow-[var(--color-terracotta)]/20 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {submitting ? 'Création du compte…' : 'Créer mon compte'}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>

                <p className="text-center text-xs text-[var(--color-taupe)] pt-3 border-t border-[var(--color-shell)]/70">
                  Déjà inscrit ?{' '}
                  <Link
                    to="/connexion"
                    className="font-semibold text-[var(--color-olive-dark)] hover:text-[var(--color-olive-deep)]"
                  >
                    Connectez-vous
                  </Link>
                </p>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ConfirmationSent({ email }: { email: string }) {
  return (
    <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-8 shadow-sm text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-olive)]/15 border border-[var(--color-olive)]/30 flex items-center justify-center mb-5">
        <CheckCircle2 className="w-7 h-7 text-[var(--color-olive-dark)]" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-[var(--color-wood)] mb-2">
        Vérifiez votre boîte mail.
      </h2>
      <p className="text-sm text-[var(--color-taupe)] leading-relaxed">
        Nous avons envoyé un lien de confirmation à{' '}
        <strong className="text-[var(--color-wood)]">{email}</strong>. Cliquez sur ce lien pour
        activer votre compte et accéder au marché.
      </p>
      <Link
        to="/connexion"
        className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] text-[var(--color-cream)] rounded-full text-xs font-semibold transition-all"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}

export function AuthHeader() {
  return (
    <header className="border-b border-[var(--color-shell)]/70 bg-[var(--color-cream)]/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-taupe)] hover:text-[var(--color-wood)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Accueil
        </Link>
      </div>
    </header>
  );
}

export function ConfigWarning() {
  return (
    <div className="mb-4 p-4 bg-[var(--color-straw)]/15 border border-[var(--color-straw)]/40 rounded-2xl text-xs text-[var(--color-wood-soft)] leading-relaxed">
      <strong className="font-semibold text-[var(--color-wood)]">Mode démo :</strong> Supabase n'est
      pas configuré (variables <code className="font-mono text-[10px]">VITE_SUPABASE_URL</code> et{' '}
      <code className="font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> manquantes). L'auth est
      désactivée tant qu'elles ne sont pas dans le <code className="font-mono text-[10px]">.env</code>
      .
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-[var(--color-paprika)]/10 border border-[var(--color-paprika)]/30 rounded-2xl text-xs text-[var(--color-paprika)]">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

export function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon: ReactNode;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-taupe)] uppercase tracking-[0.16em] mb-1.5">
        <span className="text-[var(--color-olive)]">{icon}</span>
        {label}
        {required && <span className="text-[var(--color-terracotta)]">*</span>}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  'w-full px-4 py-3 bg-[var(--color-sand)]/60 border border-[var(--color-shell)] focus:border-[var(--color-olive)] focus:bg-[var(--color-cream)] rounded-xl text-sm font-medium text-[var(--color-wood)] placeholder-[var(--color-taupe-light)] outline-none transition-colors';

export function GoogleButton({
  label,
  onError,
}: {
  label: string;
  onError: (msg: string) => void;
}) {
  const { signInWithGoogle, isConfigured } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    onError('');
    setBusy(true);
    const res = await signInWithGoogle();
    if (res.error) {
      setBusy(false);
      onError(res.error);
    }
    // En cas de succès, le navigateur est redirigé vers Google puis revient
    // sur /mon-compte — on laisse `busy` à true le temps de la redirection.
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || !isConfigured}
      className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[var(--color-cream)] hover:bg-[var(--color-sand)]/60 disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--color-shell)] text-[var(--color-wood)] rounded-full text-sm font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
    >
      <GoogleLogo />
      {busy ? 'Redirection…' : label}
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[var(--color-shell)]" />
      <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-taupe)] font-semibold">
        ou
      </span>
      <div className="flex-1 h-px bg-[var(--color-shell)]" />
    </div>
  );
}
