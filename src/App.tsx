import { useState, useEffect, useTransition, ReactNode } from 'react';
import { Commercant } from './types';
import { DbManager } from './db';
import Login from './components/Login';
import Scanner from './components/Scanner';
import LoyaltyHub from './components/LoyaltyHub';
import Settings from './components/Settings';
import Catalogue from './components/Catalogue';
import Orders from './components/Orders';
import { LogOut, Sun, ReceiptEuro, Wallet, UserPlus, HeartHandshake, ShoppingBag, ClipboardList } from 'lucide-react';
import { ShinyButton } from './components/ui/shiny-button';

type AppTab = 'fidelite' | 'commandes' | 'catalogue';

export default function App() {
  const [activeMerchant, setActiveMerchant] = useState<Commercant | null>(null);
  const [activeClientPass, setActiveClientPass] = useState<string | null>(null);
  const [isSupabase, setIsSupabase] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<AppTab>('fidelite');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [, startTransition] = useTransition();

  // Polling global du nombre de commandes "à traiter" pour le badge d'onglet.
  // Tourne dès qu'un commerçant est connecté, indépendamment de l'onglet actif.
  useEffect(() => {
    if (!activeMerchant) return;
    let cancelled = false;
    const refresh = async () => {
      const res = await DbManager.listMerchantOrders(activeMerchant.id);
      if (cancelled) return;
      const count = res.data.filter(
        (o) => o.statut === 'en_attente' || o.statut === 'confirmee'
      ).length;
      setPendingOrdersCount(count);
    };
    refresh();
    const id = setInterval(refresh, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeMerchant]);

  // Load active session on start
  useEffect(() => {
    const savedMerchant = localStorage.getItem('saint_cyp_merchant_session_v1');
    if (savedMerchant) {
      try {
        setActiveMerchant(JSON.parse(savedMerchant));
      } catch (e) {
        // Fallback
      }
    }
    checkSupabaseStatus();
  }, []);

  const checkSupabaseStatus = () => {
    const config = DbManager.getSupabaseConfig();
    setIsSupabase(config.isEnabled && !!config.url && !!config.key);
  };

  const handleConfigChange = () => {
    startTransition(() => {
      checkSupabaseStatus();
      // If config changed, force a logout or wipe session to protect consistency
      localStorage.removeItem('saint_cyp_merchant_session_v1');
      setActiveMerchant(null);
      setActiveClientPass(null);
    });
  };

  const handleLoginSuccess = (merchant: Commercant) => {
    startTransition(() => {
      setActiveMerchant(merchant);
      localStorage.setItem('saint_cyp_merchant_session_v1', JSON.stringify(merchant));
    });
  };

  const handleLogout = () => {
    startTransition(() => {
      setActiveMerchant(null);
      setActiveClientPass(null);
      localStorage.removeItem('saint_cyp_merchant_session_v1');
    });
  };

  const triggerDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!activeMerchant) {
    return (
      <Login onSuccess={handleLoginSuccess} isSupabaseConfigured={isSupabase} />
    );
  }

  return (
    <div className="min-h-screen bg-paper text-[var(--color-wood)] font-sans flex flex-col justify-between" id="app-wrapper">
      {/* Bordure haute olive */}
      <div className="h-1 bg-gradient-to-r from-[var(--color-olive)] via-[var(--color-sage)] to-[var(--color-olive)]" />

      {/* Primary Top Bar */}
      <header className="h-20 border-b border-[var(--color-shell)]/70 bg-[var(--color-cream)]/80 backdrop-blur-md flex items-center justify-between px-6 md:px-12 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-olive)] border border-[var(--color-olive-dark)] rounded-xl flex items-center justify-center font-extrabold text-xl text-[var(--color-cream)] font-display shadow-md shadow-[var(--color-olive)]/20">
            S
          </div>
          <div>
            <h1 className="text-sm md:text-base font-display font-extrabold uppercase tracking-wider text-[var(--color-wood)]">
              StCyp'Wallet
            </h1>
            <p className="text-[10px] md:text-xs text-[var(--color-taupe)] font-mono">
              Dashboard Commerçant Saint-Cyp v2.4
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Database connection badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--color-sand)] border border-[var(--color-shell)] rounded-xl text-[10px] font-mono font-bold text-[var(--color-taupe)]">
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabase ? 'bg-[var(--color-olive)] animate-pulse' : 'bg-[var(--color-stone)]'}`} />
            <span>{isSupabase ? 'SUPABASE' : 'DÉMO LOCALE'}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[9px] text-[var(--color-taupe)] font-bold block uppercase tracking-wider">Session Active</span>
              <span className="text-xs md:text-sm font-bold text-[var(--color-wood)] max-w-[120px] md:max-w-none truncate block">
                {activeMerchant.nom_enseigne}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl border border-[var(--color-shell)] bg-[var(--color-cream)] hover:bg-[var(--color-sand)] flex items-center justify-center text-[var(--color-taupe)] hover:text-[var(--color-paprika)] transition-all outline-none cursor-pointer"
              title="Se déconnecter"
              id="header-logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 md:py-12 flex flex-col gap-8">
        {/* Tab navigation */}
        <div className="flex items-center gap-2 bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-2xl p-1.5 w-full md:w-auto md:self-start shadow-sm">
          <TabButton
            active={activeTab === 'fidelite'}
            onClick={() => startTransition(() => setActiveTab('fidelite'))}
            icon={<HeartHandshake className="w-3.5 h-3.5" />}
            label="Fidélité & encaissement"
          />
          <TabButton
            active={activeTab === 'commandes'}
            onClick={() => startTransition(() => setActiveTab('commandes'))}
            icon={<ClipboardList className="w-3.5 h-3.5" />}
            label="Commandes"
            badge={pendingOrdersCount > 0 ? pendingOrdersCount : undefined}
          />
          <TabButton
            active={activeTab === 'catalogue'}
            onClick={() => startTransition(() => setActiveTab('catalogue'))}
            icon={<ShoppingBag className="w-3.5 h-3.5" />}
            label="Catalogue produits"
          />
        </div>

        {activeTab === 'commandes' ? (
          <Orders merchant={activeMerchant} />
        ) : activeTab === 'catalogue' ? (
          <Catalogue merchant={activeMerchant} />
        ) : (
        /* ACTIVE COMMERÇANT DASHBOARD Flow */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left side column: The scanner screen */}
          <div className="lg:col-span-5 space-y-6">
            <Scanner
              onScanSuccess={(id) => startTransition(() => setActiveClientPass(id))}
              onManualSelect={(id) => startTransition(() => setActiveClientPass(id))}
              refreshTrigger={refreshTrigger}
            />

              {/* Little stats info card under the scanner */}
              <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-6 shadow-sm relative overflow-hidden flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-[var(--color-taupe)] uppercase tracking-wider">Configuration Enseigne</h4>
                  <p className="text-sm font-semibold text-[var(--color-wood-soft)]">
                    Seuil récompense : <strong className="text-[var(--color-olive-deep)] font-mono text-base">{activeMerchant.seuil_remise_pts} points</strong>
                  </p>
                  <p className="text-[10px] text-[var(--color-taupe)]">
                    Mode : 1 Euro d'achat (€) = 1 point fidélité crédité.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-olive)]/10 border border-[var(--color-olive)]/20 flex items-center justify-center text-[var(--color-olive-deep)] shrink-0">
                  <ReceiptEuro className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Right side column: Scanned user details or vacant bento box */}
            <div className="lg:col-span-7">
              {activeClientPass ? (
                <LoyaltyHub
                  idPassWallet={activeClientPass}
                  merchant={activeMerchant}
                  onClear={() => startTransition(() => setActiveClientPass(null))}
                  onTransactionComplete={triggerDataRefresh}
                />
              ) : (
                <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center min-h-[420px]">
                  <div className="w-16 h-16 rounded-3xl bg-[var(--color-sand)] border border-[var(--color-shell)] flex items-center justify-center text-[var(--color-olive-deep)] mb-6 shadow-inner">
                    <Wallet className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-[var(--color-wood)] tracking-tight">
                    En attente de transaction ou pass client...
                  </h3>
                  <p className="text-xs text-[var(--color-taupe)] mt-2 max-w-[340px] mx-auto leading-relaxed">
                    Scannez le QR Code StCyp'Wallet d'un client, ou sélectionnez-en un dans la liste de simulation de test. Vous pouvez également cliquer ci-dessous pour créer un pass à la volée.
                  </p>

                  <ShinyButton
                    onClick={() => {
                      const randomId = 'PASS-CYP-' + Math.floor(1000 + Math.random() * 9000);
                      startTransition(() => setActiveClientPass(randomId));
                    }}
                    className="mt-6 w-full max-w-xs"
                    id="create-new-client-empty-btn"
                  >
                    <UserPlus className="w-5 h-5 text-[var(--color-cream)]" />
                    Créer un Nouveau Client / Pass
                  </ShinyButton>

                  <div className="mt-8 border-t border-[var(--color-shell)]/70 pt-8 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-[var(--color-sand)] border border-[var(--color-shell)] rounded-2xl text-center">
                        <span className="text-lg font-bold text-[var(--color-olive-deep)] font-mono">1</span>
                        <p className="text-[10px] text-[var(--color-taupe)] mt-1 uppercase font-semibold">Scanner le pass</p>
                      </div>
                      <div className="p-3 bg-[var(--color-sand)] border border-[var(--color-shell)] rounded-2xl text-center">
                        <span className="text-lg font-bold text-[var(--color-olive-deep)] font-mono">2</span>
                        <p className="text-[10px] text-[var(--color-taupe)] mt-1 uppercase font-semibold">Saisir de valeur</p>
                      </div>
                      <div className="p-3 bg-[var(--color-sand)] border border-[var(--color-shell)] rounded-2xl text-center">
                        <span className="text-lg font-bold text-[var(--color-olive-deep)] font-mono">3</span>
                        <p className="text-[10px] text-[var(--color-taupe)] mt-1 uppercase font-semibold font-mono">Créditer l'id</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Settings & DB Configuration Section */}
        <Settings onConfigChange={handleConfigChange} />
      </main>

      {/* Coastal Mediterranean Footer */}
      <footer className="bg-[var(--color-sand)] border-t border-[var(--color-shell)]/70 py-6 px-4 text-center text-[var(--color-taupe-light)] text-xs font-mono">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-2">
          <p className="flex items-center gap-1.5 font-bold text-[var(--color-taupe)]">
            <Sun className="w-4 h-4 text-[var(--color-straw)] animate-spin" style={{ animationDuration: '30s' }} />
            © 2026 VILLE DE SAINT-CYPRIEN • CONFORMITY ASSURED
          </p>
          <p className="text-[10px] text-[var(--color-taupe-light)] max-w-[400px]">
            Traitement du schéma relationnel cagnottes_saint_cyp. Données chiffrées selon les protocoles de cartes Wallet.
          </p>
        </div>
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 md:flex-none flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
        active
          ? 'bg-[var(--color-olive)] text-[var(--color-cream)] shadow-md shadow-[var(--color-olive)]/20'
          : 'text-[var(--color-taupe)] hover:text-[var(--color-wood)] hover:bg-[var(--color-sand)]'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md text-[10px] font-mono font-extrabold ${
          active
            ? 'bg-[var(--color-cream)] text-[var(--color-olive-deep)]'
            : 'bg-[var(--color-terracotta)] text-[var(--color-cream)]'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}
