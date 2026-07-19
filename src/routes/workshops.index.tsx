import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Workshop = {
  id: string;
  slug: string;
  code: string;
  title: string;
  body: string;
  image_url: string | null;
  event_date: string | null;
  duration: string | null;
  status: string;
  ordering: number;
};

export const Route = createFileRoute("/workshops/")({
  head: () => {
    const title = "All Workshops & Events — ARCHERZ";
    const description =
      "Every ARCHERZ workshop, tournament and event at GPTC Attingal. Upcoming sessions first, past events archived below.";
    const url = "https://archerz.lovable.app/workshops";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: WorkshopsIndex,
});

// Parse things like "OCT 12", "OCT 12 · 2026", "2026-10-12", "TBA" → Date | null
function parseDate(input: string | null): Date | null {
  if (!input) return null;
  const s = input.trim();
  if (!s || /^(tba|tbd)$/i.test(s)) return null;
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return new Date(iso);
  // Try "MON DD" — assume current or next year
  const m = s.match(/([A-Za-z]{3,})\s+(\d{1,2})(?:\s*[·,]\s*(\d{4}))?/);
  if (m) {
    const [, mon, day, yr] = m;
    const year = yr ? Number(yr) : new Date().getFullYear();
    const d = new Date(`${mon} ${day} ${year}`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function statusMeta(status: string): { label: string; tone: "live" | "queued" | "closed" } {
  const s = (status || "").toUpperCase();
  if (s === "CLOSED" || s === "FINISHED" || s === "PAST") return { label: "FINISHED", tone: "closed" };
  if (s === "QUEUED" || s === "SOON" || s === "COMING_SOON") return { label: "COMING SOON", tone: "queued" };
  return { label: "OPEN", tone: "live" };
}

function WorkshopsIndex() {
  const [rows, setRows] = useState<Workshop[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("workshops")
      .select("id,slug,code,title,body,image_url,event_date,duration,status,ordering")
      .eq("is_published", true)
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        else setRows((data as Workshop[]) ?? []);
      });
  }, []);

  const { upcoming, past } = useMemo(() => {
    const list = rows ?? [];
    const now = Date.now();
    const isClosed = (w: Workshop) => statusMeta(w.status).tone === "closed";

    const upcomingList = list
      .filter((w) => !isClosed(w))
      .sort((a, b) => {
        const da = parseDate(a.event_date)?.getTime();
        const db = parseDate(b.event_date)?.getTime();
        // Dated upcoming first (soonest), then TBD, ordering as tiebreak
        if (da && db) return da - db;
        if (da && !db) return -1;
        if (!da && db) return 1;
        return (a.ordering ?? 0) - (b.ordering ?? 0);
      });

    const pastList = list
      .filter((w) => {
        const d = parseDate(w.event_date)?.getTime();
        return isClosed(w) || (d !== undefined && d < now && statusMeta(w.status).tone !== "queued");
      })
      .sort((a, b) => {
        const da = parseDate(a.event_date)?.getTime() ?? 0;
        const db = parseDate(b.event_date)?.getTime() ?? 0;
        return db - da; // most recent past first
      });

    // Ensure no duplicates between upcoming and past
    const pastIds = new Set(pastList.map((w) => w.id));
    return {
      upcoming: upcomingList.filter((w) => !pastIds.has(w.id)),
      past: pastList,
    };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background text-foreground has-mobile-dock">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 md:px-10 lg:px-14">
          <Link
            to="/"
            className="tap-target font-mono text-[11px] uppercase tracking-[0.32em] text-signal transition-colors hover:text-foreground"
          >
            ← ARCHERZ
          </Link>
          <div className="hidden md:flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            <Link to="/" hash="team" className="link-quiet hover:text-foreground">TEAM</Link>
            <Link to="/" hash="contact" className="link-quiet hover:text-foreground">CONTACT</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-5 pt-16 pb-10 md:px-10 md:pt-24">
        <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-signal">
          [ ARCHERZ · GPTC ATTINGAL · SCHEDULE ]
        </div>
        <h1 className="mt-6 font-display text-[12vw] leading-[0.9] tracking-tight md:text-[6rem] lg:text-[7rem]">
          All Workshops
          <br />
          <span className="italic font-serif font-normal">&amp; events.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-muted-foreground">
          Upcoming sessions are lined up first, sorted by date. Past events are archived
          below. Registration is only live while a session is marked <span className="text-signal">OPEN</span>.
        </p>
      </section>

      {err && (
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="border border-destructive bg-surface p-4 font-mono text-[11px] uppercase tracking-[0.24em] text-destructive">
            {err}
          </div>
        </div>
      )}

      {rows === null && !err ? (
        <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 font-mono text-xs uppercase tracking-[0.32em] text-muted-foreground">
          [ LOADING… ]
        </div>
      ) : (
        <>
          <ListBlock label="UPCOMING" items={upcoming} emptyLabel="No upcoming events queued. Check back soon." />
          {past.length > 0 && (
            <ListBlock label="ARCHIVE · PAST EVENTS" items={past} emptyLabel="" />
          )}
        </>
      )}

      <div className="mx-auto max-w-[1400px] px-5 pb-24 md:px-10 md:pb-32">
        <Link to="/" className="btn-ghost">← BACK TO ARCHERZ</Link>
      </div>
    </div>
  );
}

function ListBlock({
  label,
  items,
  emptyLabel,
}: {
  label: string;
  items: Workshop[];
  emptyLabel: string;
}) {
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-14">
      <div className="flex items-end justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
          [ {label} ]
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {items.length} {items.length === 1 ? "event" : "events"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 border border-hairline bg-surface p-6 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-8 border-t border-hairline">
          {items.map((w) => {
            const meta = statusMeta(w.status);
            const clickable = meta.tone !== "closed";
            const Wrap: (p: { children: React.ReactNode }) => React.ReactElement = clickable
              ? ({ children }) => (
                  <Link
                    to="/workshops/$slug"
                    params={{ slug: w.slug }}
                    className="card-lift group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-hairline py-6 transition-colors hover:bg-surface md:grid-cols-[120px_1fr_140px_140px_auto] md:gap-10 md:py-10 md:px-6 lg:px-10"
                  >
                    {children}
                  </Link>
                )
              : ({ children }) => (
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-hairline py-6 opacity-70 md:grid-cols-[120px_1fr_140px_140px_auto] md:gap-10 md:py-10 md:px-6 lg:px-10">
                    {children}
                  </div>
                );

            return (
              <Wrap key={w.id}>
                <div className="font-mono text-xs uppercase tracking-[0.24em] text-signal">
                  {w.code}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-2xl leading-tight md:text-4xl">
                    {w.title}
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                    {w.body}
                  </p>
                </div>
                <div className="hidden md:block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <div className="text-signal">DATE</div>
                  <div className="mt-1 text-foreground">{w.event_date ?? "TBA"}</div>
                </div>
                <div className="hidden md:block font-mono text-xs uppercase tracking-[0.2em]">
                  <span
                    className={`inline-flex px-2 py-1 border ${
                      meta.tone === "live"
                        ? "border-signal text-signal"
                        : meta.tone === "queued"
                        ? "border-hairline text-foreground"
                        : "border-hairline text-muted-foreground"
                    }`}
                  >
                    {meta.label}
                  </span>
                </div>
                <div
                  className={`font-mono text-2xl transition-transform ${
                    clickable ? "text-signal group-hover:translate-x-2" : "text-muted-foreground"
                  }`}
                >
                  {clickable ? "↗" : "×"}
                </div>
              </Wrap>
            );
          })}
        </div>
      )}
    </section>
  );
}
