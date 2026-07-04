import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center font-mono">
        <div className="eyebrow">ERR // 404</div>
        <h1 className="mt-4 text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">SIGNAL LOST</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The route you requested does not exist in the ARCHERS network.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-brutal btn-brutal-hover">
            → RETURN TO BASE
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="eyebrow">ERR // RUNTIME</div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          SYSTEM FAULT
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try reloading the module.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-brutal btn-brutal-hover"
          >
            RETRY
          </button>
          <a href="/" className="btn-ghost">
            HOME
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ARCHERS — Engineer the Future | CS & Tech Students, GPTC Attingal" },
      {
        name: "description",
        content:
          "ARCHERS is the Association of Computer Science & Technology Students at Government Polytechnic College Attingal. Learn. Build. Innovate.",
      },
      { name: "author", content: "ARCHERS" },
      { name: "theme-color", content: "#f4f1ea" },
      { property: "og:title", content: "ARCHERS — Engineer the Future" },
      {
        property: "og:description",
        content:
          "Association of Computer Science & Technology Students, GPTC Attingal. Workshops, events, and a community building the next generation of developers.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ARCHERS" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ARCHERS — Engineer the Future" },
      {
        name: "twitter:description",
        content:
          "Association of Computer Science & Technology Students, GPTC Attingal.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
