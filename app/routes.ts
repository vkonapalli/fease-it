import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("projects", "routes/projects.tsx"),
  route("settings", "routes/settings.tsx"),
  route("login", "routes/login.tsx"),
] satisfies RouteConfig;
