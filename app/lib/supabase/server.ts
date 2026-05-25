import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

/**
 * Create a Supabase server client using the SERVICE ROLE (secret) key.
 *
 * ⚠️ SECURITY WARNING: This key bypasses Row Level Security (RLS).
 * Every loader and action MUST call `supabase.auth.getUser()` first
 * and manually scope queries to the authenticated user.
 */
export function getSupabaseServerClient(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase server environment variables. Please set SUPABASE_URL and SUPABASE_SECRET_KEY."
    );
  }

  const headers = new Headers();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie") ?? "")
          .filter((c): c is { name: string; value: string } => c.value !== undefined);
      },
      setAll(cookiesToSet, _responseHeaders) {
        cookiesToSet.forEach(({ name, value, options }) => {
          headers.append("Set-Cookie", serializeCookieHeader(name, value, options));
        });
      },
    },
  });

  return { supabase, headers };
}


