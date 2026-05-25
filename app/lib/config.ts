/**
 * Check if Supabase environment variables are configured.
 * Works in both browser (import.meta.env) and server (process.env) contexts.
 */
export function isSupabaseConfigured(): boolean {
  // Browser environment
  if (typeof window !== "undefined") {
    return Boolean(
      import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    );
  }

  // Server environment
  return Boolean(
    (process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL) &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  );
}
