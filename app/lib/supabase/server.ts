import { createServerClient, parseCookieHeader } from "@supabase/ssr";

export function getSupabaseServerClient(request: Request) {
  const headers = new Headers();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY."
    );
  }

  const cookies = parseCookieHeader(request.headers.get("cookie") ?? "").map((c) => ({
    name: c.name,
    value: c.value ?? "",
  }));

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookies;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const optString = Object.entries(options || {})
            .filter(([, v]) => v !== undefined && v !== false)
            .map(([k, v]) => {
              if (v === true) return k;
              return `${k}=${v}`;
            })
            .join("; ");
          headers.append("Set-Cookie", `${name}=${value}${optString ? `; ${optString}` : ""}`);
        });
      },
    },
  });

  return { supabase, headers };
}
