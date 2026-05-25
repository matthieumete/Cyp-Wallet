import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import type { ClientSaintCyp } from '@shared/types';

export interface SignUpInput {
  nom: string;
  email: string;
  password: string;
  telephone?: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: ClientSaintCyp | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (input: SignUpInput) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ClientSaintCyp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Hard timeout safety net: never block the UI more than 3s on auth init.
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('[portal] auth init timeout, sortie forcée du chargement');
        setLoading(false);
      }
    }, 3000);

    // Apply session synchronously, but let profile fetch happen in the
    // background so the UI never blocks on a slow Supabase call.
    const applySession = (sess: Session | null) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
      if (sess?.user) {
        ensureProfile(sess.user)
          .then((prof) => {
            if (mounted) setProfile(prof);
          })
          .catch((e) => {
            console.error('[portal] ensureProfile error:', e);
            if (mounted) setProfile(null);
          });
      } else {
        setProfile(null);
      }
    };

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        applySession(data.session);
      } catch (e) {
        console.error('[portal] getSession error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      applySession(sess);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthState['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: translateAuthError(error.message) };
    return {};
  };

  const signUp: AuthState['signUp'] = async (input) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          nom: input.nom.trim(),
          telephone: input.telephone?.trim() || null,
        },
      },
    });
    if (error) return { error: translateAuthError(error.message) };
    if (!data.session) return { needsConfirmation: true };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await ensureProfile(user);
      setProfile(prof);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function ensureProfile(user: User): Promise<ClientSaintCyp | null> {
  // 1. Lookup par auth_user_id (cas standard pour les comptes créés via le portail)
  const { data: byAuthId, error: selectError } = await supabase
    .from('clients_saint_cyp')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (selectError) {
    console.error('[portal] ensureProfile select by auth_user_id failed:', selectError);
  }
  if (byAuthId) return byAuthId as ClientSaintCyp;

  // 2. Fallback : trouver une ligne existante par email et la rattacher
  //    (cas des fiches créées dans le wallet commerçant avant que le compte
  //    Supabase Auth existe)
  if (user.email) {
    const { data: byEmail, error: emailError } = await supabase
      .from('clients_saint_cyp')
      .select('*')
      .eq('email', user.email)
      .is('auth_user_id', null)
      .maybeSingle();

    if (emailError) {
      console.error('[portal] ensureProfile select by email failed:', emailError);
    }

    if (byEmail) {
      console.info('[portal] ensureProfile: rattachement de la fiche existante', byEmail.id_pass_wallet);
      const { data: linked, error: linkError } = await supabase
        .from('clients_saint_cyp')
        .update({ auth_user_id: user.id })
        .eq('id_pass_wallet', byEmail.id_pass_wallet)
        .select()
        .single();

      if (linkError) {
        console.error('[portal] ensureProfile link failed:', linkError);
        return byEmail as ClientSaintCyp;
      }
      return linked as ClientSaintCyp;
    }
  }

  // 3. Création d'une nouvelle fiche
  const meta = (user.user_metadata ?? {}) as { nom?: string; telephone?: string };
  const passId =
    'PASS-CYP-' + user.id.replace(/-/g, '').substring(0, 8).toUpperCase();

  const row = {
    id_pass_wallet: passId,
    nom: meta.nom?.trim() || user.email?.split('@')[0] || 'Client',
    email: user.email ?? null,
    telephone: meta.telephone || null,
    auth_user_id: user.id,
  };

  const { data: created, error: insertError } = await supabase
    .from('clients_saint_cyp')
    .insert(row)
    .select()
    .single();

  if (insertError) {
    console.error('[portal] ensureProfile insert failed:', insertError);
    // Race condition : si la ligne vient d'être créée par un autre tab/process,
    // re-fetch par auth_user_id pour la récupérer.
    const { data: retry } = await supabase
      .from('clients_saint_cyp')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    return (retry as ClientSaintCyp) ?? null;
  }

  return created as ClientSaintCyp;
}

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'Email ou mot de passe incorrect.',
    'Email not confirmed': 'Veuillez confirmer votre adresse email avant de vous connecter.',
    'User already registered': 'Un compte existe déjà avec cet email.',
    'Password should be at least 6 characters': 'Le mot de passe doit faire au moins 6 caractères.',
  };
  return map[message] ?? message;
}
