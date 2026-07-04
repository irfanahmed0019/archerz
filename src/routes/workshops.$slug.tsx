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
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — ARCHERZ` },
      { name: "description", content: "Workshop detail — ARCHERZ, GPTC Attingal." },
    ],
  }),
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 md:px-10">
          <Link to="/" className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
            ← ARCHERZ
          </Link>
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {w.code}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-hairline">
        {w.image_url && (
          <>
            <img
              src={w.image_url}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-20 blur-2xl"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in oklab, var(--color-background) 40%, transparent), var(--color-background))",
              }}
            />
          </>
        )}
        <div className="relative mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-36">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em]">
            <span className="text-signal">[ WORKSHOP · {w.code} ]</span>
            <span className="border border-hairline px-2 py-1 text-signal">{w.status}</span>
            {w.event_date && <span className="text-muted-foreground">{w.event_date}</span>}
            {w.duration && <span className="text-muted-foreground">{w.duration}</span>}
          </div>
          <h1 className="mt-8 font-display text-[12vw] leading-[0.85] tracking-tighter md:text-[9rem]">
            {w.title}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">{w.body}</p>
          {w.register_url && (
            <a
              href={w.register_url}
              target="_blank"
              rel="noreferrer"
              className="btn-brutal btn-brutal-hover mt-10 inline-flex"
            >
              → REGISTER NOW
            </a>
          )}
        </div>
      </section>

      {w.long_description && (
        <section className="mx-auto max-w-[900px] px-5 py-20 md:px-10 md:py-28">
          <div className="eyebrow text-signal">[ ABOUT ]</div>
          <div className="mt-6 whitespace-pre-line text-lg leading-relaxed text-foreground">
            {w.long_description}
          </div>
        </section>
      )}

      {w.image_url && (
        <section className="border-y border-hairline">
          <img src={w.image_url} alt={w.title} className="block max-h-[70vh] w-full object-contain" />
        </section>
      )}

      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-10">
        <Link to="/" className="btn-ghost">
          ← BACK TO ARCHERZ
        </Link>
      </section>
    </div>
  );
}
