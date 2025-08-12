export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const watiBaseUrl = import.meta.env.VITE_WATI_BASE_URL as string;
export const watiApiKey = import.meta.env.WATI_API_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!watiBaseUrl || !watiApiKey) {
  throw new Error('Missing WATI environment variables');
}
