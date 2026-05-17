import type { Route } from "./+types/_health";

export function loader({}: Route.LoaderArgs) {
  return Response.json({ status: "ok" });
}
