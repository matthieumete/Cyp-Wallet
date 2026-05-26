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
  profileError: string | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (input: SignUpInput) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  retryProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ClientSaintCyp | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (u: User) => {
    setProfileError(null);
    const res = await ensureProfileSafe(u);
    if (res.profile) {
      setProfile(res.profile);
    } else {
      setProfile(null);
      setProfileError(res.error ?? 'Impossible de créer ou retrouver votre fiche client.');
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('[portal] auth init timeout, sortie forcée du chargement');
        setLoading(false);
      }
    }, 3000);

    const applySession = (sess: Session | null) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
      if (sess?.user) {
        loadProfile(sess.user);
      } else {
        setProfile(null);
        setProfileError(null);
      }
    };

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        applySession(data.session);
      } catch (e) {
        console.error('[portal] getSession error:', e);
      } finally {
        clearTimeout(timeout);
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

  const retryProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        profileError,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        retryProfile,
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

function withTimeout<T>(p: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`Timeout (${ms / 1000}s) sur ${label}. Probablement un token de session invalide ou un problème réseau.`));
    }, ms);
    Promise.resolve(p).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/**
 * Tente toute la chaîne possible pour obtenir une fiche client liée à l'utilisateur.
 * Retourne soit le profile, soit un message d'erreur explicite pour l'UI.
 * Chaque appel Supabase est wrappé dans un timeout de 5s pour ne jamais pendre.
 */
async function ensureProfileSafe(
  user: User
): Promise<{ profile?: ClientSaintCyp; error?: string }> {
  try {
    // 1. Lookup par auth_user_id (cas standard)
    const r1 = await withTimeout(
      supabase
        .from('clients_saint_cyp')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle(),
      5000,
      'SELECT clients_saint_cyp par auth_user_id'
    );

    if (r1.error) {
      console.error('[portal] ensureProfile SELECT auth_user_id failed:', r1.error);
      return { error: explainSelectError(r1.error.message, r1.error.code) };
    }
    if (r1.data) return { profile: r1.data as ClientSaintCyp };

    // 2. Lookup par email pour récupérer une fiche existante orpheline
    //    (créée via le wallet commerçant avant que le compte Auth existe)
    if (user.email) {
      const r2 = await withTimeout(
        supabase
          .from('clients_saint_cyp')
          .select('*')
          .eq('email', user.email)
          .is('auth_user_id', null)
          .maybeSingle(),
        5000,
        'SELECT clients_saint_cyp par email'
      );

      if (!r2.error && r2.data) {
        console.info('[portal] ensureProfile: rattachement de la fiche', r2.data.id_pass_wallet);
        const linked = await withTimeout(
          supabase
            .from('clients_saint_cyp')
            .update({ auth_user_id: user.id })
            .eq('id_pass_wallet', r2.data.id_pass_wallet)
            .select()
            .maybeSingle(),
          5000,
          'UPDATE clients_saint_cyp.auth_user_id'
        );

        if (linked.data) return { profile: linked.data as ClientSaintCyp };
        if (linked.error) {
          console.error('[portal] ensureProfile link failed:', linked.error);
          return { profile: { ...r2.data, auth_user_id: user.id } as ClientSaintCyp };
        }
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

    const inserted = await withTimeout(
      supabase.from('clients_saint_cyp').insert(row),
      5000,
      'INSERT clients_saint_cyp'
    );

    if (inserted.error) {
      console.error('[portal] ensureProfile INSERT failed:', inserted.error);
      // Race condition ou conflit → re-fetch
      const retry = await withTimeout(
        supabase
          .from('clients_saint_cyp')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle(),
        5000,
        'SELECT clients_saint_cyp après conflit'
      );
      if (retry.data) return { profile: retry.data as ClientSaintCyp };
      return { error: explainInsertError(inserted.error.message, inserted.error.code) };
    }

    // Re-fetch après insert
    const fresh = await withTimeout(
      supabase
        .from('clients_saint_cyp')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle(),
      5000,
      'SELECT clients_saint_cyp après insertion'
    );

    if (fresh.data) return { profile: fresh.data as ClientSaintCyp };

    return {
      error:
        'La fiche a été créée mais la relecture est vide. Vérifiez les politiques RLS de SELECT sur la table `clients_saint_cyp`.',
    };
  } catch (e: any) {
    console.error('[portal] ensureProfile unexpected error:', e);
    return { error: e.message ?? `Erreur réseau : ${String(e)}` };
  }
}

function explainSelectError(message: string, code?: string): string {
  if (code === '42P01' || /relation .* does not exist/i.test(message)) {
    return "La table `clients_saint_cyp` n'existe pas. Avez-vous exécuté le SQL de l'étape 2 dans Supabase ?";
  }
  if (code === '42703' || /column .* does not exist/i.test(message)) {
    return "La colonne `auth_user_id` n'existe pas sur `clients_saint_cyp`. Exécutez (ou ré-exécutez) le SQL de migration de l'étape 2.";
  }
  return `Lecture impossible : ${message}`;
}

function explainInsertError(message: string, code?: string): string {
  if (code === '42501' || /row-level security/i.test(message)) {
    return "Politique RLS bloquante sur INSERT clients_saint_cyp. Vérifiez que les policies 'Clients self insert' ou 'Allow public all on clients' existent.";
  }
  if (code === '23505' || /duplicate key/i.test(message)) {
    return 'Conflit : une fiche existe déjà avec ce pass ou cet auth_user_id. Supprimez les doublons dans Supabase Table Editor.';
  }
  if (code === '23503' || /foreign key/i.test(message)) {
    return 'Contrainte FK : votre auth_user_id ne référence pas un utilisateur valide. Déconnectez-vous, supprimez votre utilisateur dans Auth → Users, et recréez un compte.';
  }
  return `Création impossible : ${message}`;
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
