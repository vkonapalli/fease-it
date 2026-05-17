# React Router v7 SSR with Vite

Use this skill when setting up a new React app with server-side rendering using React Router v7 (framework mode) and Vite, or when the user references "the regional-assistant SSR pattern".

## Architecture Overview

- **React Router v7** in framework mode (not file-system routing — uses code-based route config)
- **Vite** as build tool with `@react-router/dev/vite` plugin
- **Streaming SSR** via `renderToPipeableStream` with bot detection
- **`react-router-serve`** as the production server
- **Containerized** with multi-stage Docker build

## Key Dependencies

```json
{
  "react": "^19",
  "react-dom": "^19",
  "react-router": "^7.6",
  "@react-router/node": "^7.6",
  "@react-router/serve": "^7.6",
  "@react-router/dev": "^7.6",
  "isbot": "^5",
  "vite": "^6",
  "@tailwindcss/vite": "^4",
  "vite-tsconfig-paths": "^5"
}
```

## Scripts

```json
{
  "build": "react-router build",
  "dev": "react-router dev",
  "start": "react-router-serve ./build/server/index.js",
  "typecheck": "react-router typegen && tsc"
}
```

## File Structure

```
app/
  entry.client.tsx    # Client hydration
  entry.server.tsx    # Streaming SSR handler
  root.tsx            # HTML shell, global ErrorBoundary
  routes.ts           # Code-based route config
  routes/
    _layout.tsx       # Shared layout (wraps child routes)
    home.tsx          # Index route
    _health.tsx       # Health check endpoint (JSON, no UI)
```

## 1. Route Config (`app/routes.ts`)

Code-based, not file-system. Use `layout()` to group routes under a shared shell, `index()` for the `/` route, `route()` for named paths.

```tsx
import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/_layout.tsx", [
    index("routes/home.tsx"),
    route("overview", "routes/overview.tsx"),
  ]),
  route("about", "routes/about.tsx"),
  route("_health", "routes/_health.tsx"),
] satisfies RouteConfig;
```

### Route types

Each route imports its generated types from `./+types/<route-name>`:

```tsx
import type { Route } from "./+types/_health";

export function loader({}: Route.LoaderArgs) {
  return { status: "ok" };
}
```

Run `react-router typegen` to generate these (included in the `typecheck` script).

### API-only routes (no UI)

Export only `loader`/`action`, no default component. Redirect GET requests if the route is POST-only:

```tsx
import { redirect } from "react-router";
import type { Route } from "./+types/track";

async function loader() {
  return redirect("/");
}

async function action({ request }: Route.ActionArgs) {
  // handle POST
  return { success: true };
}

export { loader, action };
```

## 2. Framework Config (`react-router.config.ts`)

```tsx
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
} satisfies Config;
```

## 3. Vite Config (`vite.config.ts`)

```tsx
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
```

If using a component library that depends on `react-router-dom` (v6 name), add:

```tsx
resolve: {
  alias: { "react-router-dom": "react-router" },
},
ssr: {
  noExternal: ["@your-org/design"],
  external: ["*.css"],
},
```

## 4. Server Entry (`app/entry.server.tsx`)

Streaming SSR with bot detection. Bots get `onAllReady` (full HTML), real users get `onShellReady` (streaming).

```tsx
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import { PassThrough } from "node:stream";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");

    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, streamTimeout + 1000);
  });
}
```

### Adding CSP or custom headers

Inject headers inside the `readyOption` callback before `resolve()`:

```tsx
responseHeaders.set(
  "Content-Security-Policy",
  `frame-ancestors https://*.example.com`,
);
```

### Error handling

Export `handleError` to log server-side errors (loader/action failures):

```tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export function handleError(
  error: unknown,
  { request }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  if (!request.signal.aborted) {
    console.error(error);
  }
}
```

## 5. Client Entry (`app/entry.client.tsx`)

```tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
```

## 6. Root (`app/root.tsx`)

Exports `Layout` (HTML shell), default `App` (just `<Outlet />`), and `ErrorBoundary`.

```tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/root";
import appStyles from "./app.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: appStyles },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404
      ? "The requested page could not be found."
      : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
```

## 7. TypeScript Config (`tsconfig.json`)

Key settings for React Router v7 framework mode:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "types": ["node", "vite/client"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "rootDirs": [".", "./.react-router/types"],
    "baseUrl": ".",
    "paths": { "~/*": ["./app/*"] },
    "verbatimModuleSyntax": true,
    "noEmit": true
  },
  "include": [
    "**/*",
    "**/.server/**/*",
    "**/.client/**/*",
    ".react-router/types/**/*"
  ]
}
```

`rootDirs` with `.react-router/types` enables the generated route types. The `~/*` path alias maps to `app/*`.

## Patterns to Follow

- **Layout routes** group pages under a shared UI shell — use `layout()` in `routes.ts`
- **Health check route** at `/_health` returns JSON `{ status: "ok" }` — no UI component needed
- **Server-only logic** goes in `loader`/`action` exports (runs only on the server)
- **`.server.ts` suffix** for server-only modules (Segment, DB clients, etc.)
- **Route types** are auto-generated — import from `./+types/<route-name>`, never hand-write loader/action arg types
- **`pnpm deploy --prod`** in the container build prunes dev dependencies for a minimal production image
