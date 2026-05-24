import { Link } from 'react-router-dom';
import {
  Leaf,
  Wheat,
  ShoppingBasket,
  Store,
  Sparkles,
  Gift,
  Clock,
  Coins,
  ArrowRight,
  MapPin,
  Heart,
  ChevronRight,
  Coffee,
  Sun,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../lib/auth';

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper text-[var(--color-wood)]">
      <Header />
      <Hero />
      <PreviewCards />
      <HowItWorks />
      <Footer />
    </div>
  );
}

function Header() {
  const { user } = useAuth();

  return (
    <header className="border-b border-[var(--color-shell)]/70 bg-[var(--color-cream)]/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo />

        <nav className="flex items-center gap-2">
          {user ? (
            <Link
              to="/mon-compte"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] text-[var(--color-cream)] rounded-full text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              Mon compte
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/connexion"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-[var(--color-wood-soft)] hover:text-[var(--color-olive-dark)] transition-colors"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] text-[var(--color-cream)] rounded-full text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
              >
                Créer un compte
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const { user } = useAuth();
  const primaryHref = user ? '/mon-compte' : '/inscription';
  const primaryLabel = user ? 'Aller à mon compte' : 'Créer mon compte gratuit';

  return (
    <section className="max-w-6xl mx-auto px-6 pt-14 pb-20 md:pt-20 md:pb-28">
      <div className="grid md:grid-cols-5 gap-10 items-center">
        <div className="md:col-span-3 space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[var(--color-sage)]/15 border border-[var(--color-sage)]/30 rounded-full text-[11px] uppercase tracking-[0.16em] font-semibold text-[var(--color-olive-deep)]">
            <Sparkles className="w-3.5 h-3.5" />
            Nouveau · Beta
          </span>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight text-[var(--color-wood)]">
            Le marché,
            <br />
            <span className="text-[var(--color-olive-dark)] italic">à portée de main.</span>
          </h1>

          <p className="text-base md:text-lg text-[var(--color-taupe)] max-w-xl leading-relaxed">
            Commandez vos produits frais auprès des commerçants du marché de Saint-Cyprien,
            cumulez vos points fidélité et retrouvez vos artisans préférés — au même endroit.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to={primaryHref}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--color-terracotta)] hover:bg-[var(--color-terracotta-dark)] text-[var(--color-cream)] rounded-full text-sm font-semibold shadow-md shadow-[var(--color-terracotta)]/20 transition-all active:scale-[0.98]"
            >
              {primaryLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-transparent hover:bg-[var(--color-shell)]/60 border border-[var(--color-stone)]/70 text-[var(--color-wood-soft)] rounded-full text-sm font-semibold transition-all cursor-pointer"
            >
              Découvrir les commerçants
            </button>
          </div>

          <div className="flex items-center gap-5 pt-6 text-[12px] text-[var(--color-taupe)]">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-olive)]" />
              Place du marché, Saint-Cyprien
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[var(--color-straw)]" />
              Mardi · Jeudi · Samedi
            </div>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="md:col-span-2 relative">
      <div className="relative bg-gradient-to-br from-[var(--color-olive)] to-[var(--color-moss)] rounded-[28px] p-7 shadow-xl shadow-[var(--color-olive-deep)]/20 overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-[var(--color-sage-light)]/20 blur-2xl" />
        <div className="absolute -left-6 -bottom-10 w-44 h-44 rounded-full bg-[var(--color-straw)]/15 blur-3xl" />

        <div className="relative flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-cream)]/15 backdrop-blur-sm flex items-center justify-center">
              <Wheat className="w-4 h-4 text-[var(--color-cream)]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-cream)]/70 font-medium">
                Mon Pass Fidélité
              </p>
              <p className="text-xs font-mono text-[var(--color-cream)]/95 font-semibold tracking-wider">
                PASS-CYP-7391
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-cream)]/15 text-[var(--color-cream)] font-medium">
            Actif
          </span>
        </div>

        <div className="relative">
          <p className="font-display text-7xl font-semibold text-[var(--color-cream)] tracking-tight leading-none">
            247
          </p>
          <p className="text-xs text-[var(--color-cream)]/80 mt-1 font-medium">
            points cumulés sur 5 commerçants
          </p>
        </div>

        <div className="relative mt-7 pt-5 border-t border-[var(--color-cream)]/15">
          <div className="flex justify-between items-center text-[11px] text-[var(--color-cream)]/90">
            <span className="font-medium">Prochaine remise</span>
            <span className="font-mono font-semibold">8 pts</span>
          </div>
          <div className="mt-2 h-1.5 bg-[var(--color-cream)]/15 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-straw)] rounded-full" style={{ width: '84%' }} />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-5 bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5 animate-sway">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-terracotta)]/15 flex items-center justify-center">
          <Gift className="w-4 h-4 text-[var(--color-terracotta-dark)]" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-taupe)] font-semibold">
            Remise dispo
          </p>
          <p className="text-xs font-semibold text-[var(--color-wood)]">
            Boulangerie l'Épi
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewCards() {
  return (
    <section className="bg-[var(--color-sand)] border-y border-[var(--color-shell)]">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-olive-dark)] font-semibold mb-3">
            Aperçu du portail
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-wood)] tracking-tight">
            Tout votre marché, dans une seule app.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <MerchantCard />
          <OrderCard />
          <LoyaltyCard />
        </div>
      </div>
    </section>
  );
}

function MerchantCard() {
  return (
    <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-5">
        <Store className="w-4 h-4 text-[var(--color-olive)]" />
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-taupe)] font-semibold">
          Vos commerçants
        </span>
      </div>

      <div className="space-y-3">
        {[
          { name: "L'Épi d'Or", emoji: '🥖', pts: 42, max: 50, color: 'var(--color-straw)' },
          { name: 'Café de l\'Ancre', emoji: '☕', pts: 35, max: 40, color: 'var(--color-terracotta)' },
          { name: 'Comptoir Saint-Cyp', emoji: '🧀', pts: 58, max: 60, color: 'var(--color-olive)' },
        ].map((m) => (
          <div key={m.name} className="flex items-center gap-3 p-3 bg-[var(--color-sand)]/60 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-cream)] border border-[var(--color-shell)] flex items-center justify-center text-base">
              {m.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--color-wood)] truncate">
                {m.name}
              </p>
              <div className="mt-1.5 h-1 bg-[var(--color-shell)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(m.pts / m.max) * 100}%`, backgroundColor: m.color }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold text-[var(--color-taupe)] shrink-0">
              {m.pts}/{m.max}
            </span>
          </div>
        ))}
      </div>

      <button className="mt-5 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[var(--color-olive-dark)] hover:text-[var(--color-olive-deep)] transition-colors cursor-pointer">
        Voir tous les commerçants
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function OrderCard() {
  return (
    <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-5">
        <ShoppingBasket className="w-4 h-4 text-[var(--color-terracotta-dark)]" />
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-taupe)] font-semibold">
          Ma commande en cours
        </span>
      </div>

      <div className="bg-gradient-to-br from-[var(--color-straw)]/20 to-[var(--color-terracotta)]/10 border border-[var(--color-straw)]/40 rounded-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-display text-sm font-semibold text-[var(--color-wood)]">
              Boulangerie l'Épi d'Or
            </p>
            <p className="text-[10px] text-[var(--color-taupe)] mt-0.5">
              Retrait samedi · 10h30
            </p>
          </div>
          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 bg-[var(--color-olive)] text-[var(--color-cream)] rounded-full">
            Prête
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-[var(--color-wood-soft)]">
          <div className="flex justify-between">
            <span>2 × Baguette tradition</span>
            <span className="font-mono">2,40 €</span>
          </div>
          <div className="flex justify-between">
            <span>1 × Pain de campagne</span>
            <span className="font-mono">4,80 €</span>
          </div>
          <div className="flex justify-between">
            <span>6 × Croissants beurre</span>
            <span className="font-mono">7,20 €</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[var(--color-straw)]/40 flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-taupe)]">
            Total
          </span>
          <span className="font-display text-base font-semibold text-[var(--color-wood)]">
            14,40 €
          </span>
        </div>
      </div>

      <button className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--color-wood)] hover:bg-[var(--color-wood-soft)] text-[var(--color-cream)] rounded-full text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer">
        <Clock className="w-3.5 h-3.5" />
        Suivre ma commande
      </button>
    </div>
  );
}

function LoyaltyCard() {
  return (
    <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-5">
        <Coins className="w-4 h-4 text-[var(--color-straw)]" />
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-taupe)] font-semibold">
          Récompenses récentes
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-[var(--color-olive)]/8 border border-[var(--color-olive)]/20 rounded-2xl">
          <div className="w-9 h-9 rounded-full bg-[var(--color-olive)] flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4 text-[var(--color-cream)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--color-wood)]">
              Remise débloquée !
            </p>
            <p className="text-[10px] text-[var(--color-taupe)] mt-0.5">
              Boulangerie · il y a 2 jours
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-[var(--color-olive-dark)]">
            -50 pts
          </span>
        </div>

        <div className="flex items-center gap-3 p-3 hover:bg-[var(--color-sand)]/60 rounded-2xl transition-colors">
          <div className="w-9 h-9 rounded-full bg-[var(--color-terracotta)]/15 flex items-center justify-center shrink-0">
            <Coffee className="w-4 h-4 text-[var(--color-terracotta-dark)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--color-wood)]">
              Café de l'Ancre
            </p>
            <p className="text-[10px] text-[var(--color-taupe)] mt-0.5">
              Hier · 4,20 €
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-[var(--color-olive)]">
            +4 pts
          </span>
        </div>

        <div className="flex items-center gap-3 p-3 hover:bg-[var(--color-sand)]/60 rounded-2xl transition-colors">
          <div className="w-9 h-9 rounded-full bg-[var(--color-straw)]/30 flex items-center justify-center shrink-0">
            <Wheat className="w-4 h-4 text-[var(--color-wood-soft)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--color-wood)]">
              Boulangerie l'Épi d'Or
            </p>
            <p className="text-[10px] text-[var(--color-taupe)] mt-0.5">
              Samedi · 12,80 €
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-[var(--color-olive)]">
            +12 pts
          </span>
        </div>
      </div>

      <button className="mt-5 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[var(--color-olive-dark)] hover:text-[var(--color-olive-deep)] transition-colors cursor-pointer">
        Tout l'historique
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <Heart className="w-5 h-5" />,
      title: 'Je crée mon compte',
      text: 'Inscription en 30 secondes avec votre email. Votre pass de fidélité est instantanément lié.',
      tint: 'var(--color-terracotta)',
    },
    {
      icon: <ShoppingBasket className="w-5 h-5" />,
      title: 'Je commande sur le marché',
      text: 'Parcourez le catalogue de vos commerçants, passez commande et retirez sur place.',
      tint: 'var(--color-olive)',
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'Je cumule mes points',
      text: 'Chaque achat — sur place ou en ligne — fait grimper votre cagnotte chez vos artisans préférés.',
      tint: 'var(--color-straw)',
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-olive-dark)] font-semibold mb-3">
          Comment ça marche
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-wood)] tracking-tight">
          Simple comme un tour de marché.
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={s.title} className="text-center md:text-left">
            <div className="flex md:block items-center gap-4 mb-4">
              <div
                className="inline-flex w-12 h-12 rounded-2xl items-center justify-center text-[var(--color-cream)] shrink-0"
                style={{ backgroundColor: s.tint }}
              >
                {s.icon}
              </div>
              <span className="font-display text-xs uppercase tracking-[0.2em] text-[var(--color-taupe-light)] font-semibold md:block md:mt-4">
                Étape {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-[var(--color-wood)] mb-2">
              {s.title}
            </h3>
            <p className="text-sm text-[var(--color-taupe)] leading-relaxed">
              {s.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-shell)] bg-[var(--color-sand)]/50">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-olive)] flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-[var(--color-cream)]" />
          </div>
          <span className="font-display text-sm font-semibold text-[var(--color-wood)]">
            Marché de Saint-Cyprien
          </span>
        </div>
        <p className="text-[11px] text-[var(--color-taupe)] font-mono">
          Portail client · Démo design · v0.1
        </p>
      </div>
    </footer>
  );
}
