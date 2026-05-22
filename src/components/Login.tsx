import { useState, FormEvent } from 'react';
import { Commercant } from '../types';
import { DbManager } from '../db';
import { BeamsBackground } from './ui/beams-background';
import { motion } from 'motion/react';
import { ShinyButton } from './ui/shiny-button';

interface LoginProps {
  onSuccess: (commercant: Commercant) => void;
  isSupabaseConfigured: boolean;
}

export default function Login({ onSuccess, isSupabaseConfigured }: LoginProps) {
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifiant.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await DbManager.loginMerchant(identifiant, password);
    if (res.success && res.data) {
      onSuccess(res.data);
    } else {
      setError(res.error || 'Identifiant ou mot de passe incorrect.');
    }
    setLoading(false);
  };

  return (
    <BeamsBackground className="absolute inset-0 w-full h-full z-50">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[400px] px-8 py-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col items-center"
        id="login-card"
      >
        {/* Supabase status indicator monospace pill at top */}
        <div className="mb-6 px-3 py-1 bg-neutral-900/85 border border-white/10 rounded-full flex items-center gap-1.5 self-center">
          <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-white animate-pulse' : 'bg-white/30'}`} />
          <span className="text-[10px] font-mono font-medium tracking-tight text-white/70">
            {isSupabaseConfigured ? 'SUPABASE : PROD' : 'LOCAL : EMULATOR'}
          </span>
        </div>

        {/* Badge minimal "S" in monochrome */}
        <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white font-mono font-extrabold text-2xl mb-4 tracking-tighter">
          S
        </div>

        <h1 className="text-xl font-medium text-white tracking-tight text-center">
          Portail Commerçants
        </h1>
        <p className="text-[10px] text-white/50 tracking-wider text-center mt-1.5 mb-8 uppercase font-mono select-none">
          Saint-Cyp Fidélité
        </p>

        {error && (
          <div className="w-full mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs text-center font-mono">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div>
            <label className="block text-[9px] font-medium text-white/60 uppercase tracking-widest mb-1.5">
              IDENTIFIANT
            </label>
            <input
              type="text"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              placeholder="ex: boulangerie_epi"
              className="w-full px-3 py-2.5 bg-neutral-900 border-none border-b border-white/10 focus:border-white rounded-md focus:ring-0 outline-none text-sm text-white placeholder-white/20 transition-all font-mono"
              id="merchant-id-input"
            />
          </div>

          <div>
            <label className="block text-[9px] font-medium text-white/60 uppercase tracking-widest mb-1.5">
              MOT DE PASSE
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full px-3 py-2.5 bg-neutral-900 border-none border-b border-white/10 focus:border-white rounded-md focus:ring-0 outline-none text-sm text-white placeholder-white/20 transition-all font-mono"
              id="merchant-pwd-input"
            />
          </div>

          <ShinyButton
            type="submit"
            disabled={loading}
            className="w-full mt-6"
            id="login-btn"
          >
            {loading ? 'Connexion en cours...' : 'Se Connecter'}
          </ShinyButton>
        </form>
      </motion.div>
    </BeamsBackground>
  );
}
