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
import { ArcherzChat } from "../components/ArcherzChat";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center font-mono">
        <div className="eyebrow">ERR // 404</div>
        <h1 className="mt-4 text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">SIGNAL LOST</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The route you requested does not exist in the ARCHERZ network.
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
      { title: "ARCHERZ — CS & Tech Students, GPTC Attingal" },
      {
        name: "description",
        content:
          "ARCHERZ is the Association of Computer Science & Technology Students at Government Polytechnic College Attingal. Learn, build, and innovate with workshops, events, and a student community.",
      },
      { name: "author", content: "ARCHERZ" },
      {
        name: "keywords",
        content:
          "ARCHERZ, ARCHERS, GPTC Attingal, GPTC Attingal association, GPTC Attingal CS association, Government Polytechnic College Attingal, Computer Science association, CS & Technology, student association Kerala, beyond the classroom, Mini Militia GPTC",
      },
      { name: "theme-color", content: "#f4f1ea" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ARCHERZ" },
      { property: "og:title", content: "ARCHERZ — CS & Tech Students Association, GPTC Attingal" },
      {
        property: "og:description",
        content:
          "ARCHERZ is the Computer Science & Technology students' association at Government Polytechnic College Attingal. Beyond the classroom — workshops, events, and student-built projects.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ARCHERZ — CS & Tech Students Association, GPTC Attingal" },
      {
        name: "twitter:description",
        content:
          "The official CS & Technology students' association at GPTC Attingal. Beyond the classroom — workshops, hackathons, community.",
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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ARCHERZ",
          alternateName: [
            "ARCHERS",
            "Association of Computer Science & Technology Students",
            "GPTC Attingal CS Association",
            "GPTC Attingal Computer Science Association",
          ],
          description:
            "ARCHERZ is the official students' association of the Computer Science & Technology Engineering department at Government Polytechnic College Attingal (GPTC Attingal), Kerala. Motto: Beyond the classroom.",
          slogan: "Beyond the classroom",
          url: "https://archerz.lovable.app",
          logo: "https://archerz.lovable.app/favicon.png",
          foundingDate: "2026",
          areaServed: "Attingal, Kerala, India",
          keywords:
            "ARCHERZ, GPTC Attingal, Computer Science association, CS & Technology, student association, Kerala",
          parentOrganization: {
            "@type": "CollegeOrUniversity",
            name: "Government Polytechnic College Attingal",
            alternateName: "GPTC Attingal",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Attingal",
              addressRegion: "Kerala",
              addressCountry: "IN",
            },
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is ARCHERZ?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "ARCHERZ is the official students' association of the Computer Science & Technology Engineering department at Government Polytechnic College Attingal (GPTC Attingal), Kerala. Its motto is 'Beyond the classroom.'",
              },
            },
            {
              "@type": "Question",
              name: "Which college does ARCHERZ belong to?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Government Polytechnic College Attingal (GPTC Attingal), Kerala, India — specifically the Computer Science & Technology Engineering department.",
              },
            },
            {
              "@type": "Question",
              name: "Is ARCHERZ the same as the GPTC Attingal CS association?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. ARCHERZ is the Computer Science & Technology students' association at GPTC Attingal.",
              },
            },
            {
              "@type": "Question",
              name: "What does ARCHERZ do?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "ARCHERZ runs technical workshops, hackathons, the annual Mini Militia tournament, and student-led community projects for the CS & Technology branch at GPTC Attingal.",
              },
            },
          ],
        }),
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
      <ArcherzChat />
    </QueryClientProvider>
  );
}
