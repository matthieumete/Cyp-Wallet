import { useState, useTransition } from 'react';
import { SupabaseConfig } from '../types';
import { DbManager } from '../db';
import { SUPABASE_SETUP_SQL } from '../data';
import { Settings as SettingsIcon, Link, Trash2, Check, Copy, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  onConfigChange: () => void;
}

export default function Settings({ onConfigChange }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState(DbManager.getSupabaseConfig());

  // Load configuration on open
  const loadConfig = () => {
    setConfig(DbManager.getSupabaseConfig());
  };

  const handleToggleOpen = () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);
    if (nextIsOpen) {
      loadConfig();
    }
  };

  const handleResetLocal = () => {
    if (window.confirm('Voulez-vous réinitialiser l’ensemble des cagnottes de démonstration locale ?')) {
      DbManager.resetLocalData();
      onConfigChange();
      alert('Cagnottes et clients locaux réinitialisés.');
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden" id="settings-accordion">
      <button
        onClick={handleToggleOpen}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-800/30 transition-all text-left outline-none cursor-pointer"
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider animate-pulse">
              {config.isEnabled ? 'Supabase Connecté ✓' : 'Base de Données & Simulateur'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {config.isEnabled 
                ? 'Base de données Supabase active via variables d’environnement.' 
                : 'Fonctionne en mode démo hors-ligne. Cliquez pour configurer.'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase font-mono px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
          {isOpen ? 'Masquer' : 'Gérer'}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-slate-800 bg-slate-950/40 p-6 space-y-6"
          >
            {/* Supabase Status Banner */}
            {config.isEnabled ? (
              <div className="p-4 bg-white/5 border border-white/20 rounded-2xl">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  Synchronisation Supabase Active !
                </h4>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  L'application est connectée avec succès à votre projet Supabase via votre fichier d'environnement. Les transactions, cagnottes et fiches coordonnées clients sont sauvegardées en temps réel sur vos tables.
                </p>
                <div className="mt-3 text-[10px] text-white font-mono font-semibold truncate bg-white/5 p-2 rounded-lg border border-white/10">
                  URL : {config.url}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Link className="w-3.5 h-3.5" />
                  Mode Démo (Stockage Local) Actif
                </h4>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Pour relier cette application à une vraie base Supabase privée, ajoutez simplement vos variables de configuration dans votre feuille <code className="text-white font-mono font-bold bg-slate-950 px-1 rounded">.env</code> :
                </p>
                <pre className="mt-2.5 bg-slate-950 p-3 rounded-lg text-[10px] text-slate-400 font-mono overflow-x-auto leading-relaxed border border-slate-850">
{`VITE_SUPABASE_URL="https://votredomaine.supabase.co"
VITE_SUPABASE_ANON_KEY="votre_cle_publique_anon_ici"`}
                </pre>
              </div>
            )}

            {/* SQL Copy Code Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Script d'initialisation SQL Supabase</span>
                <button
                  onClick={copySqlToClipboard}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-200 text-[10px] font-bold uppercase font-mono rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  type="button"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copié !' : 'Copier le script SQL'}
                </button>
              </div>
              <div className="bg-slate-950 text-slate-400 text-[10px] font-mono p-4 rounded-2xl max-h-[185px] overflow-y-auto shadow-inner leading-relaxed border border-slate-850">
                <pre>{SUPABASE_SETUP_SQL}</pre>
              </div>
            </div>

            {/* Local Reset Database Button */}
            <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Réinitialiser les données de démo</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Efface toutes les cagnottes et fiches coordonnées enregistrées dans ce navigateur.</p>
              </div>
              <button
                type="button"
                onClick={handleResetLocal}
                className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
