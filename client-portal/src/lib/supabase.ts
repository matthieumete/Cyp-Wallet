import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

if (!isSupabaseConfigured) {
  console.warn(
    '[portal] VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis dans le .env à la racine du repo.'
  );
}

/**
 * Stub client utilisé tant que les variables d'env Supabase ne sont pas
 * configurées. Toute requête se résout immédiatement en erreur claire,
 * de sorte que l'UI affiche un message au lieu de pendre.
 */
function createStubClient(): SupabaseClient {
  const error = new Error('Supabase non configuré : ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY au .env.');
  const failResult = { data: null, error } as const;

  // Proxy thenable qui accepte n'importe quelle chaîne de méthodes PostgREST
  // (.select().eq().eq().order().maybeSingle() etc.) et se résout en erreur.
  const makeBuilder = (): any => {
    const handler: ProxyHandler<any> = {
      get(_target, prop) {
        if (prop === 'then') {
          return (onFulfilled: any) => Promise.resolve(onFulfilled(failResult));
        }
        if (prop === Symbol.toPrimitive || prop === 'toString') {
          return () => '[stub query builder]';
        }
        return () => makeBuilder();
      },
      apply() {
        return makeBuilder();
      },
    };
    return new Proxy(function () {}, handler);
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: async () => failResult,
      signInWithOAuth: async () => failResult,
      signUp: async () => failResult,
      signOut: async () => ({ error: null }),
      getUser: async () => failResult,
    },
    from: () => makeBuilder(),
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Neutralise navigator.locks : sans ce passe-plat, getSession() peut
        // deadlock quand un onglet précédent a gardé le lock (StrictMode dev,
        // crash, onglet fermé brutalement). Voir supabase/auth-js#888.
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    })
  : createStubClient();
