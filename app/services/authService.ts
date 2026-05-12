import { getSupabaseBrowserClient, isSupabaseConfigured as checkSupabaseConfigured } from "~/lib/supabase/client";

export { checkSupabaseConfigured as isSupabaseConfigured };

export async function signInAnonymously() {
  if (!checkSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  if (!checkSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!checkSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function sendMagicLink(email: string) {
  if (!checkSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
  return data;
}

export async function resetPassword(email: string) {
  if (!checkSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!checkSupabaseConfigured()) return;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!checkSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getSession() {
  if (!checkSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  if (!checkSupabaseConfigured()) return { subscription: { unsubscribe: () => {} } };
  const supabase = getSupabaseBrowserClient();
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
