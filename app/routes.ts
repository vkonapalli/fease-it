import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/_layout.tsx", [
    index("routes/home.tsx"),
    route("projects", "routes/projects.tsx"),
    route("projects/:projectId/*", "routes/project-detail.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
  route("login", "routes/login.tsx"),
  route("_health", "routes/_health.tsx"),
  route("api/chat", "routes/api.chat.ts"),
] satisfies RouteConfig;
