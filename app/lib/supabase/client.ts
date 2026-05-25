import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  client = createBrowserClient(supabaseUrl, supabaseKey);
  return client;
}

export function isSupabaseConfigured(): boolean {
  // Server environment (e.g., SSR loaders/actions)
  if (typeof process !== "undefined" && process.env) {
    return Boolean(
      (process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL) &&
        (process.env.SUPABASE_SECRET_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
    );
  }
  // Browser environment
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );
}
