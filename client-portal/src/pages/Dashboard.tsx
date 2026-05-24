import type { ReactNode } from 'react';
import {
  LogOut,
  CreditCard,
  ShoppingBasket,
  Store,
  Coins,
  Sparkles,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../lib/auth';

export default function Dashboard() {
  const { profile, user, signOut } = useAuth();

  const displayName = profile?.nom || user?.email?.split('@')[0] || 'Client';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-paper text-[var(--color-wood)]">
      <DashboardHeader displayName={displayName} initials={initials} onSignOut={signOut} />

      <main className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-8">
        <section>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-olive-dark)] font-semibold mb-2">
            Bonjour {displayName.split(' ')[0]}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Bienvenue sur votre portail.
          </h1>
          <p className="text-sm text-[var(--color-taupe)] mt-2 max-w-2xl">
            Votre compte est créé et votre pass de fidélité est prêt à être utilisé chez les
            commerçants du marché.
          </p>
        </section>

        <PassCard profile={profile} email={user?.email ?? null} />

        <section className="grid md:grid-cols-3 gap-4">
          <ComingSoonCard
            icon={<Store className="w-5 h-5" />}
            tint="var(--color-olive)"
            title="Mes commerçants"
            text="Bientôt : la liste de vos artisans préférés avec votre progression de points."
          />
          <ComingSoonCard
            icon={<ShoppingBasket className="w-5 h-5" />}
            tint="var(--color-terracotta)"
            title="Mes commandes"
            text="Bientôt : commandez en ligne, choisissez un créneau de retrait sur le marché."
          />
          <ComingSoonCard
            icon={<Coins className="w-5 h-5" />}
            tint="var(--color-straw)"
            title="Mon historique"
            text="Bientôt : retrouvez tous vos achats et points cumulés au fil des semaines."
          />
        </section>
      </main>
    </div>
  );
}

function DashboardHeader({
  displayName,
  initials,
  onSignOut,
}: {
  displayName: string;
  initials: string;
  onSignOut: () => Promise<void>;
}) {
  return (
    <header className="border-b border-[var(--color-shell)]/70 bg-[var(--color-cream)]/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo to="/mon-compte" />

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-[var(--color-shell)]">
            <div className="w-9 h-9 rounded-full bg-[var(--color-olive)] text-[var(--color-cream)] flex items-center justify-center font-display font-semibold text-sm">
              {initials || '·'}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-[var(--color-wood)]">{displayName}</p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-taupe)] font-medium">
                Connecté
              </p>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--color-wood-soft)] hover:text-[var(--color-paprika)] bg-[var(--color-shell)]/40 hover:bg-[var(--color-shell)] rounded-full transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        </div>
      </div>
    </header>
  );
}

function PassCard({ profile, email }: { profile: ReturnType<typeof useAuth>['profile']; email: string | null }) {
  return (
    <div className="relative bg-gradient-to-br from-[var(--color-olive)] to-[var(--color-moss)] rounded-3xl p-7 md:p-8 shadow-xl shadow-[var(--color-olive-deep)]/20 overflow-hidden">
      <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-[var(--color-sage-light)]/20 blur-2xl" />
      <div className="absolute -left-6 -bottom-10 w-56 h-56 rounded-full bg-[var(--color-straw)]/15 blur-3xl" />

      <div className="relative grid md:grid-cols-2 gap-6 items-center">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-[var(--color-cream)]/80" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-cream)]/80 font-semibold">
              Mon Pass Fidélité
            </span>
          </div>
          <p className="font-mono text-2xl md:text-3xl font-bold text-[var(--color-cream)] tracking-wider">
            {profile?.id_pass_wallet ?? '—'}
          </p>
          <p className="text-xs text-[var(--color-cream)]/80 mt-2">
            Présentez ce pass aux commerçants pour cumuler vos points.
          </p>
        </div>

        <div className="bg-[var(--color-cream)]/10 backdrop-blur-sm border border-[var(--color-cream)]/15 rounded-2xl p-5 space-y-3">
          <Detail label="Nom" value={profile?.nom ?? '—'} />
          <Detail label="Email" value={email ?? profile?.email ?? '—'} />
          <Detail label="Téléphone" value={profile?.telephone || 'Non renseigné'} mono />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--color-cream)]/65 font-semibold mb-0.5">
        {label}
      </p>
      <p className={`text-sm text-[var(--color-cream)] font-medium truncate ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function ComingSoonCard({
  icon,
  tint,
  title,
  text,
}: {
  icon: ReactNode;
  tint: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-[var(--color-cream)]"
          style={{ backgroundColor: tint }}
        >
          {icon}
        </div>
        <span className="text-[9px] uppercase tracking-[0.18em] font-semibold text-[var(--color-taupe)] flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Bientôt
        </span>
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-wood)] mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-[var(--color-taupe)] leading-relaxed">{text}</p>
    </div>
  );
}
