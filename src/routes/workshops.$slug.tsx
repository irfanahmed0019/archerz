import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Workshop = {
  id: string;
  slug: string;
  code: string;
  title: string;
  body: string;
  long_description: string | null;
  image_url: string | null;
  event_date: string | null;
  duration: string | null;
  status: string;
  register_url: string | null;
};

export const Route = createFileRoute("/workshops/$slug")({
  head: ({ params }) => {
    const title = params.slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const pageTitle = `${title} — ARCHERZ Workshop`;
    const description = `${title} is a workshop hosted by ARCHERZ, the Association of Computer Science & Technology Students at GPTC Attingal. Learn hands-on, build a project, and join the community.`;
    const url = `https://archerz.lovable.app/workshops/${params.slug}`;
    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: description },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: pageTitle },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: WorkshopPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="eyebrow text-signal">ERR // 404</div>
        <h1 className="mt-4 font-display text-5xl">Workshop not found</h1>
        <Link to="/" className="btn-brutal btn-brutal-hover mt-6 inline-flex">
          ← BACK
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md text-center">
        <div className="eyebrow text-signal">ERR</div>
        <h1 className="mt-4 font-display text-3xl">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/" className="btn-brutal btn-brutal-hover mt-6 inline-flex">
          ← HOME
        </Link>
      </div>
    </div>
  ),
});

// Split long_description by "## Guidelines" (case-insensitive) into about + guidelines
function splitDescription(text: string | null): { about: string; guidelines: string[] } {
  if (!text) return { about: "", guidelines: [] };
  const parts = text.split(/^#{1,3}\s*guidelines\s*$/im);
  const about = (parts[0] ?? "").trim();
  const rest = (parts[1] ?? "").trim();
  const guidelines = rest
    ? rest
        .split(/\n+/)
        .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
        .filter(Boolean)
    : [];
  return { about, guidelines };
}

function WorkshopPage() {
  const { slug } = Route.useParams();
  const [w, setW] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) setErr(error.message);
      else setW(data as Workshop | null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="font-mono text-xs uppercase tracking-[0.32em] text-muted-foreground">
          [ LOADING… ]
        </div>
      </div>
    );
  }
  if (err) throw new Error(err);
  if (!w) throw notFound();

  const { about, guidelines } = splitDescription(w.long_description);
  const aboutText = about || w.body;

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: w!.title, url });
        return;
      } catch {
        // fallthrough
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied");
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 md:px-10">
          <Link to="/" className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
            ← ARCHERZ
          </Link>
          <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            <Link to="/" hash="events" className="hover:text-foreground">EVENTS</Link>
            <Link to="/" hash="team" className="hover:text-foreground">TEAM</Link>
            <Link to="/" hash="contact" className="hover:text-foreground">CONTACT</Link>
          </div>
        </div>
      </header>

      {/* Title block */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-[1400px] px-5 pt-16 pb-10 text-center md:px-10 md:pt-24">
          <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-signal">
            ARCHERZ · GPTC ATTINGAL PRESENTS
          </div>
          <h1 className="mt-6 font-display text-[10vw] leading-[0.9] tracking-tight md:text-[6rem]">
            {w.title}
          </h1>
          <div className="mx-auto mt-6 h-[3px] w-24 bg-signal" />
        </div>
      </section>

      {/* Poster + info */}
      <section className="mx-auto max-w-[1400px] px-5 pb-24 md:px-10">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Poster */}
          <div className="relative">
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] backdrop-blur">
              <span className={`h-2 w-2 rounded-full ${w.status === "OPEN" ? "bg-signal" : "bg-muted-foreground"}`} />
              {w.status}
            </div>
            {w.image_url ? (
              <img
                src={w.image_url}
                alt={w.title}
                className="w-full rounded-2xl border border-hairline object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-hairline bg-surface font-mono text-xs uppercase tracking-[0.32em] text-muted-foreground">
                NO IMAGE
              </div>
            )}
          </div>

          {/* Info stack */}
          <div className="flex flex-col gap-6">
            {/* About */}
            <div className="rounded-2xl border border-hairline bg-surface p-6 md:p-8">
              <h2 className="font-display text-2xl text-signal">About The Event</h2>
              <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                {aboutText}
              </p>
            </div>

            {/* Guidelines */}
            {guidelines.length > 0 && (
              <div className="rounded-2xl border border-hairline bg-surface p-6 md:p-8">
                <h2 className="font-display text-2xl text-signal">Guidelines</h2>
                <ol className="mt-4 space-y-3">
                  {guidelines.map((g, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full border border-signal font-mono text-[10px] text-signal">
                        {i + 1}
                      </span>
                      <span className="text-[15px] leading-relaxed">{g}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Register + share */}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              {w.register_url ? (
                <a
                  href={w.register_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-center gap-3 rounded-2xl bg-signal px-8 py-5 font-mono text-sm uppercase tracking-[0.28em] text-background transition hover:opacity-90"
                >
                  REGISTER NOW
                  <span className="transition group-hover:translate-x-1">↗</span>
                </a>
              ) : (
                <div className="rounded-2xl border border-hairline px-8 py-5 text-center font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  REGISTRATION CLOSED
                </div>
              )}
              <button
                onClick={share}
                className="flex items-center justify-center gap-2 rounded-2xl border border-hairline px-6 py-5 font-mono text-xs uppercase tracking-[0.28em] hover:border-signal"
              >
                ⤴ SHARE
              </button>
            </div>
          </div>
        </div>

        {/* Meta cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <MetaCard label="CODE" value={w.code} />
          <MetaCard label="DATE" value={w.event_date ?? "TBA"} />
          <MetaCard label="DURATION" value={w.duration ?? "—"} />
        </div>

        <div className="mt-16">
          <Link to="/" className="btn-ghost">
            ← BACK TO ARCHERZ
          </Link>
        </div>
      </section>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-signal">{label}</div>
      <div className="mt-3 font-display text-2xl">{value}</div>
    </div>
  );
}
