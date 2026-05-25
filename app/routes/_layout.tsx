import { Outlet, useLoaderData } from "react-router";
import type { Route } from "./+types/_layout";
import { Header } from "~/components/layout/Header";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import { isSupabaseConfigured } from "~/lib/supabase/client";

export async function loader({ request }: Route.LoaderArgs) {
  if (!isSupabaseConfigured()) {
    return { user: null };
  }

  try {
    const { supabase } = getSupabaseServerClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    return { user };
  } catch {
    return { user: null };
  }
}

export default function AppLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <Outlet />
    </div>
  );
}
