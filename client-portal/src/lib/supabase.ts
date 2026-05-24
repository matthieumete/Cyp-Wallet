import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

if (!isSupabaseConfigured) {
  console.warn(
    '[portal] VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis dans le .env à la racine du repo.'
  );
}

// Stub client when env vars are missing — keeps types happy and avoids
// runtime crashes on page load. All auth calls will surface a clear error
// via the `isConfigured` guard in the AuthProvider.
function createStubClient(): SupabaseClient {
  const error = new Error('Supabase non configuré : ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY au .env.');
  const fail = async () => ({ data: null, error });
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: fail,
      signUp: fail,
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: fail }) }),
      insert: () => ({ select: () => ({ single: fail }) }),
    }),
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createStubClient();
