import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { LogIn, Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { signInWithEmail, signUpWithEmail, sendMagicLink } from "~/services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        navigate("/projects");
      } else if (mode === "signup") {
        await signUpWithEmail(email, password);
        setMessage("Check your email to confirm your account.");
      } else if (mode === "magic") {
        await sendMagicLink(email);
        setMessage("Magic link sent! Check your email.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

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

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-success">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="you@example.com"
              />
            </div>

            {mode !== "magic" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="••••••••"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "magic" ? (
                <Mail className="h-4 w-4 mr-1" />
              ) : (
                <LogIn className="h-4 w-4 mr-1" />
              )}
              {submitLabel}
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            {mode === "signin" ? (
              <>
                <button
                  type="button"
                  onClick={() => { setMode("magic"); setError(""); setMessage(""); }}
                  className="text-accent hover:underline text-left inline-flex items-center gap-1"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Sign in with magic link
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
                  className="text-gray-600 hover:text-primary text-left"
                >
                  Need an account? Create one
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(""); setMessage(""); }}
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
