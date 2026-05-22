import { useState, useEffect, useTransition } from 'react';
import { Commercant } from './types';
import { DbManager } from './db';
import Login from './components/Login';
import Scanner from './components/Scanner';
import LoyaltyHub from './components/LoyaltyHub';
import Settings from './components/Settings';
import { Store, LogOut, Sun, Wifi, MessageSquareCode, Sparkles, ReceiptEuro, Wallet, HeartHandshake, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShinyButton } from './components/ui/shiny-button';

export default function App() {
  const [activeMerchant, setActiveMerchant] = useState<Commercant | null>(null);
  const [activeClientPass, setActiveClientPass] = useState<string | null>(null);
  const [isSupabase, setIsSupabase] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isPending, startTransition] = useTransition();

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
    <div className="min-h-screen bg-brand-sand text-slate-100 font-sans flex flex-col justify-between" id="app-wrapper">
      {/* Dynamic Mediterranean Sun Header Border */}
      <div className="h-1 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700" />

      {/* Primary Top Bar */}
      <header className="h-20 border-b border-slate-800/80 bg-[#1e293b]/50 backdrop-blur-md flex items-center justify-between px-6 md:px-12 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center font-extrabold text-xl text-white font-mono shadow-lg shadow-white/5">
            S
          </div>
          <div>
            <h1 className="text-sm md:text-base font-display font-extrabold uppercase tracking-wider text-white">
              StCyp'Wallet
            </h1>
            <p className="text-[10px] md:text-xs text-slate-400 font-mono">
              Dashboard Commerçant Saint-Cyp v2.4
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Database connection badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-[10px] font-mono font-bold text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabase ? 'bg-white animate-pulse' : 'bg-white/40'}`} />
            <span>{isSupabase ? 'SUPABASE' : 'DÉMO LOCALE'}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Session Active</span>
              <span className="text-xs md:text-sm font-bold text-slate-100 max-w-[120px] md:max-w-none truncate block">
                {activeMerchant.nom_enseigne}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all outline-none"
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
        {/* ACTIVE COMMERÇANT DASHBOARD Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left side column: The scanner screen */}
          <div className="lg:col-span-5 space-y-6">
            <Scanner
              onScanSuccess={(id) => startTransition(() => setActiveClientPass(id))}
              onManualSelect={(id) => startTransition(() => setActiveClientPass(id))}
              refreshTrigger={refreshTrigger}
            />

              {/* Little stats info card under the scanner */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md relative overflow-hidden flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configuration Enseigne</h4>
                  <p className="text-sm font-semibold text-slate-200">
                    Seuil récompense : <strong className="text-white font-mono text-base">{activeMerchant.seuil_remise_pts} points</strong>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Mode : 1 Euro d'achat (€) = 1 point fidélité crédité.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
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
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center min-h-[420px]">
                  <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-white mb-6 shadow-inner">
                    <Wallet className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-slate-100 tracking-tight">
                    En attente de transaction ou pass client...
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-[340px] mx-auto leading-relaxed">
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
                    <UserPlus className="w-5 h-5 text-white" />
                    Créer un Nouveau Client / Pass
                  </ShinyButton>

                  <div className="mt-8 border-t border-slate-800/80 pt-8 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                        <span className="text-lg font-bold text-white font-mono">1</span>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Scanner le pass</p>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                        <span className="text-lg font-bold text-white font-mono">2</span>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Saisir de valeur</p>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                        <span className="text-lg font-bold text-white font-mono">3</span>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold font-mono">Créditer l'id</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* Global Settings & DB Configuration Section */}
        <Settings onConfigChange={handleConfigChange} />
      </main>

      {/* Coastal Mediterranean Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-6 px-4 text-center text-slate-500 text-xs font-mono">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-2">
          <p className="flex items-center gap-1.5 font-bold text-slate-400">
            <Sun className="w-4 h-4 text-white/60 animate-spin" style={{ animationDuration: '30s' }} />
            © 2026 VILLE DE SAINT-CYPRIEN • CONFORMITY ASSURED
          </p>
          <p className="text-[10px] text-slate-500 max-w-[400px]">
            Traitement du schéma relationnel cagnottes_saint_cyp. Données chiffrées selon les protocoles de cartes Wallet.
          </p>
        </div>
      </footer>
    </div>
  );
}
