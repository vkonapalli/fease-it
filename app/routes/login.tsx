import { useState } from "react";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { LogIn, Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import { isSupabaseConfigured } from "~/lib/supabase/client";

export async function loader({ request }: Route.LoaderArgs) {
  if (!isSupabaseConfigured()) {
    // Local-only mode: no auth needed, redirect to projects
    return redirect("/projects");
  }

  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return redirect("/projects", { headers });
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  if (!isSupabaseConfigured()) {
    return redirect("/projects");
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as "signin" | "signup" | "magic";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { supabase, headers } = getSupabaseServerClient(request);

  try {
    if (intent === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message, message: null };
      }
      return redirect("/projects", { headers });
    }

    if (intent === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { error: error.message, message: null };
      }
      return { error: null, message: "Check your email to confirm your account." };
    }

    if (intent === "magic") {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        return { error: error.message, message: null };
      }
      return { error: null, message: "Magic link sent! Check your email." };
    }

    return { error: "Invalid request.", message: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Something went wrong.",
      message: null,
    };
  }
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");

  const title = mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Magic link";
  const submitLabel = mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send link";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Fease-it</h1>
          <p className="text-sm text-gray-500 mt-1">Feasibility calculator</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>

          {actionData?.error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-error">
              {actionData.error}
            </div>
          )}
          {actionData?.message && (
            <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-success">
              {actionData.message}
            </div>
          )}

          <Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value={mode} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="you@example.com"
              />
            </div>

            {mode !== "magic" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="••••••••"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "magic" ? (
                <Mail className="h-4 w-4 mr-1" />
              ) : (
                <LogIn className="h-4 w-4 mr-1" />
              )}
              {submitLabel}
            </Button>
          </Form>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            {mode === "signin" ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode("magic")}
                  className="text-accent hover:underline text-left inline-flex items-center gap-1"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Sign in with magic link
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-gray-600 hover:text-primary text-left"
                >
                  Need an account? Create one
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-gray-600 hover:text-primary text-left inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/projects" className="hover:text-gray-600 underline">
            Continue without signing in
          </Link>
        </p>
      </div>
    </div>
  );
}
