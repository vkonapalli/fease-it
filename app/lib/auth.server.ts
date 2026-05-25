import { redirect } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import { isSupabaseConfigured } from "~/lib/supabase/client";

/**
 * Require an authenticated user in a loader or action.
 * Returns the user object, or throws a redirect to /login.
 *
 * ⚠️ The returned supabase client uses the SERVICE ROLE key.
 * Always scope queries to `user.id`.
 */
export async function requireAuth(request: Request) {
  if (!isSupabaseConfigured()) {
    // Local-only mode: no auth required
    return { user: null, supabase: null, headers: new Headers() };
  }

  const { supabase, headers } = getSupabaseServerClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw redirect("/login", { headers });
  }

  return { user, supabase, headers };
}

/**
 * Get the current user without redirecting.
 * Returns null if not authenticated or Supabase is not configured.
 */
export async function getAuthUser(request: Request) {
  if (!isSupabaseConfigured()) {
    return { user: null, supabase: null, headers: new Headers() };
  }

  const { supabase, headers } = getSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabase, headers };
}
