/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_WATI_BASE_URL: string;
  readonly WATI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
