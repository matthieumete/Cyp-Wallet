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

              <form
                onSubmit={handleSubmit}
                className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-6 md:p-7 shadow-sm space-y-4"
              >
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
