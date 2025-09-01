const globalEnv = typeof process !== "undefined" ? process.env : undefined;

export const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ?? globalEnv?.VITE_SUPABASE_URL
) as string;
export const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? globalEnv?.VITE_SUPABASE_ANON_KEY
) as string;
export const watiBaseUrl = (
  import.meta.env.VITE_WATI_BASE_URL ?? globalEnv?.VITE_WATI_BASE_URL
) as string;
export const watiApiKey = (
  import.meta.env.VITE_WATI_API_KEY ??
  import.meta.env.WATI_API_KEY ??
  globalEnv?.VITE_WATI_API_KEY ??
  globalEnv?.WATI_API_KEY
) as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// WATI is optional - only validate if one is provided
if ((watiBaseUrl && !watiApiKey) || (!watiBaseUrl && watiApiKey)) {
  console.warn('WATI configuration incomplete - both VITE_WATI_BASE_URL and VITE_WATI_API_KEY must be provided together');
}
