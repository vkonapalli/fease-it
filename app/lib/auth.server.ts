import { redirect } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import { isSupabaseConfigured } from "~/lib/supabase/client";
import { getSession } from "~/lib/sessions.server";

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
  const session = await getSession(request.headers.get("cookie"));
  const userId = session.get("sub");

  if (!userId) {
    throw redirect("/login", { headers });
  }

  const user = { id: userId, email: session.get("email") };

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
  const session = await getSession(request.headers.get("cookie"));
  const userId = session.get("sub");

  if (!userId) {
    return { user: null, supabase, headers };
  }

  const user = { id: userId, email: session.get("email") };

  return { user, supabase, headers };
}
