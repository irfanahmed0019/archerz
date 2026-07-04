import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import archLogo from "@/assets/arch-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const NAV_LINKS = [
  { href: "#workshops", label: "Workshops" },
  { href: "#events", label: "Events" },
  { href: "#team", label: "Team" },
  { href: "#community", label: "Community" },
];

const PILLARS = [
  {
    tag: "01",
    title: "LEARN",
    body: "Learn beyond the classroom through practical experience and teamwork.",
    icon: (
      <path d="M4 6h16M4 12h10M4 18h16" />
    ),
  },
  {
    tag: "02",
    title: "BUILD",
    body: "Turn ideas into real projects using modern technologies and hands-on collaboration.",
    icon: (
      <path d="M4 20h16M6 20V10l6-4 6 4v10M10 20v-6h4v6" />
    ),
  },
  {
    tag: "03",
    title: "INNOVATE",
    body: "Explore emerging technologies and create solutions for real-world challenges.",
    icon: (
      <path d="M12 3l3 6 6 .9-4.5 4.2 1.1 6.4L12 17.8 6.4 20.5 7.5 14 3 9.9 9 9z" />
    ),
  },
];

const WORKSHOPS = [
  {
    id: "MOD_01",
    title: "DESIGN WITH AI",
    body: "Create websites, interfaces, and digital experiences using modern AI-powered design tools.",
    date: "OCT 12",
    status: "OPEN",
  },
  {
    id: "MOD_02",
    title: "TYPING SPEED CHALLENGE",
    body: "Test your typing speed, accuracy, and consistency in a competitive real-time environment.",
    date: "OCT 17",
    status: "OPEN",
  },
  {
    id: "MOD_03",
    title: "BLIND CODING CHALLENGE",
    body: "Test your ability to write accurate, functional code without seeing your screen.",
    date: "TBD",
    status: "QUEUED",
  },
];

const TEAM = [
  { name: "Arjun V.", role: "Chairperson" },
  { name: "Sneha R.", role: "Vice Chairperson" },
  { name: "Rahul S.", role: "Secretary" },
  { name: "Meera K.", role: "Joint Secretary" },
  { name: "Vikram S.", role: "Technical Coordinator" },
  { name: "Anjali M.", role: "Event Coordinator" },
  { name: "Rohan K.", role: "Community Coordinator" },
  { name: "Karthik P.", role: "Media & Design" },
];

const ROADMAP = [
  {
    tag: "PHASE_01",
    title: "ARCHERS LAUNCH",
    body: "Official launch of the Association of Computer Science & Technology Students.",
    status: "ACTIVE",
  },
  {
    tag: "PHASE_02",
    title: "FIRST TECH WORKSHOP",
    body: "Practical training sessions designed to develop technical skills beyond the classroom.",
    status: "IN_PROGRESS",
  },
  {
    tag: "PHASE_03",
    title: "COMMUNITY EVENTS",
    body: "Competitions, challenges, and collaborative events that turn learning into real-world experience.",
    status: "SCHEDULED",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Logo({ size = 28 }: { size?: number }) {
  return (
    <img
      src={archLogo.url}
      alt="ARCHERS emblem"
      width={size}
      height={size}
      className="block"
      style={{ filter: "invert(1)" }}
    />
  );
}

function TickerBar() {
  const items = [
    "SYSTEM_ONLINE",
    "EST. 2026",
    "GPTC ATTINGAL",
    "CS & TECHNOLOGY DIVISION",
    "LEARN / BUILD / INNOVATE",
    "MOD_01 · MOD_02 · MOD_03",
    "MINI MILITIA · OCT 25",
    "STATUS: RECRUITING",
  ];
  const loop = [...items, ...items];
  return (
    <div className="border-y border-hairline bg-surface overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-2.5 font-mono text-xs tracking-[0.24em] text-muted-foreground">
        {loop.map((t, i) => (
          <span key={i} className="mx-6 flex items-center gap-6">
            <span className="inline-block h-1.5 w-1.5 bg-signal" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled ? "border-hairline bg-background/85 backdrop-blur" : "border-transparent bg-background"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
        <a href="#top" className="flex items-center gap-3">
          <Logo size={28} />
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-[0.18em] text-foreground">
              ARCHERS
            </span>
            <span className="hidden font-mono text-[10px] tracking-[0.24em] text-muted-foreground md:inline">
              /GPTC
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="#community" className="hidden btn-brutal btn-brutal-hover md:inline-flex">
            JOIN_COMMUNITY
          </a>
          <button
            aria-label="Toggle menu"
            className="btn-ghost md:hidden !px-3 !py-2"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block h-0.5 w-5 bg-current" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-hairline bg-background md:hidden">
          <div className="flex flex-col gap-1 px-5 py-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-hairline py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#community"
              onClick={() => setOpen(false)}
              className="btn-brutal btn-brutal-hover mt-3 justify-center"
            >
              JOIN_COMMUNITY
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-hairline">
      <div className="absolute inset-0 bg-grid opacity-70" aria-hidden />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-40" aria-hidden />
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--color-signal) 22%, transparent) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-28">
        {/* Meta strip */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 bg-signal animate-pulse" />
            SYS.ARCHERS // v1.0 // ONLINE
          </div>
          <div>LAT 8.6982° N · LON 76.8156° E</div>
        </div>

        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:items-end">
          {/* Big logo */}
          <div className="relative flex items-center justify-center">
            <div className="corner-ticks p-6 md:p-10">
              <img
                src={archLogo.url}
                alt="ARCHERS logo mark"
                className="h-40 w-40 md:h-56 md:w-56"
                style={{ filter: "invert(1)" }}
              />
            </div>
          </div>

          <div>
            <div className="eyebrow mb-4">[ 00 // INIT ]</div>
            <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-foreground md:text-8xl">
              ENGINEER
              <br />
              THE{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-signal">FUTURE</span>
                <span
                  className="absolute inset-x-0 bottom-1 z-0 h-3 md:h-5"
                  style={{ background: "color-mix(in oklab, var(--color-signal) 20%, transparent)" }}
                  aria-hidden
                />
              </span>
              <span className="ml-2 inline-block h-[0.9em] w-[0.5ch] translate-y-1 bg-signal align-baseline animate-blink" />
            </h1>
            <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-muted-foreground md:text-lg">
              Association of Computer Science &amp; Technology Students, Government Polytechnic
              College Attingal. Building the next generation of developers, innovators, and
              technology leaders.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
              <span className="text-foreground">LEARN</span>
              <span className="text-signal">/</span>
              <span className="text-foreground">BUILD</span>
              <span className="text-signal">/</span>
              <span className="text-foreground">INNOVATE</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#community" className="btn-brutal btn-brutal-hover">
                → JOIN ARCHERS
              </a>
              <a href="#events" className="btn-ghost">
                EXPLORE EVENTS
              </a>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <div className="border-l-2 border-signal pl-3">
                <div className="text-foreground font-semibold">EST</div>
                <div className="mt-1">2026</div>
              </div>
              <div className="border-l-2 border-signal pl-3">
                <div className="text-foreground font-semibold">DIV</div>
                <div className="mt-1">CS &amp; TECH</div>
              </div>
              <div className="border-l-2 border-signal pl-3">
                <div className="text-foreground font-semibold">MODE</div>
                <div className="mt-1">RECRUITING</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section id="about" className="border-b border-hairline">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="eyebrow">01 // THE IDENTITY</div>
            <div className="mt-4 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
              MANIFESTO
            </div>
            <div className="mt-8 hidden md:block panel p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal">
                STATUS
              </div>
              <div className="mt-3 font-mono text-sm text-foreground">
                &gt; system.init()
                <br />
                &gt; associate.ready
                <br />
                &gt; awaiting_operators_
                <span className="inline-block h-3 w-2 bg-signal align-middle animate-blink" />
              </div>
            </div>
          </div>
          <div className="md:col-span-8">
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-5xl">
              ARCHERS IS NOT JUST AN ASSOCIATION.
              <br />
              <span className="text-muted-foreground">
                MOVE BEYOND TEXTBOOKS AND START CREATING.
              </span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              From workshops to real-world projects, ARCHERS creates opportunities for students to
              learn, build, and grow together. We believe the best way to learn technology is by
              creating with others — hands on the keyboard, not just eyes on the slides.
            </p>

            <div className="mt-14 grid gap-5 sm:grid-cols-3">
              {PILLARS.map((p) => (
                <div key={p.title} className="panel corner-ticks p-6">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    <span className="text-signal">{p.tag}</span>
                    <span>PILLAR</span>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-6 h-8 w-8 text-signal"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="square"
                  >
                    {p.icon}
                  </svg>
                  <div className="mt-6 font-display text-xl font-bold tracking-wide text-foreground">
                    {p.title}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Workshops() {
  return (
    <section id="workshops" className="border-b border-hairline">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="eyebrow">02 // MODULES</div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              TECHNICAL WORKSHOPS
            </h2>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
              [ BUILDING SKILLS BEYOND CLASSROOMS ]
            </p>
          </div>
          <a href="#events" className="btn-ghost self-start md:self-auto">
            VIEW_SCHEDULE →
          </a>
        </div>

        <div className="mt-14 grid gap-0 border border-hairline md:grid-cols-3">
          {WORKSHOPS.map((w, i) => (
            <a
              key={w.id}
              href="#community"
              className={`group relative flex flex-col justify-between p-8 transition-colors hover:bg-surface ${
                i < WORKSHOPS.length - 1 ? "border-b border-hairline md:border-b-0 md:border-r" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  <span className="text-signal">{w.id}</span>
                  <span
                    className={`px-2 py-1 border ${
                      w.status === "OPEN"
                        ? "border-signal text-signal"
                        : "border-hairline text-muted-foreground"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
                <h3 className="mt-8 font-display text-2xl font-bold leading-tight text-foreground">
                  {w.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{w.body}</p>
              </div>
              <div className="mt-10 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    DATE
                  </div>
                  <div className="mt-1 font-mono text-lg text-foreground">{w.date}</div>
                </div>
                <span className="font-mono text-xs uppercase tracking-[0.24em] text-signal transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function PriorityEvent() {
  return (
    <section id="events" className="relative overflow-hidden border-b border-hairline bg-surface">
      <div className="absolute inset-0 bg-grid-fine opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="eyebrow">03 // PRIORITY EVENT</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            EVENT_TYPE: <span className="text-signal">ESPORTS</span>
          </div>
        </div>

        <div className="grid gap-8 border border-foreground bg-background md:grid-cols-[1.4fr_1fr]">
          <div className="border-b border-hairline p-8 md:border-b-0 md:border-r md:p-14">
            <div className="font-mono text-xs uppercase tracking-[0.24em] text-signal">
              [ FLAGSHIP TOURNAMENT ]
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold leading-[0.95] tracking-tight text-foreground md:text-6xl">
              MINI MILITIA
              <br />
              TOURNAMENT
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Join the ultimate battle. Show off your skills in our multiplayer combat tournament —
              solo grit, squad tactics, and a live scoreboard until one team stands.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#community" className="btn-brutal btn-brutal-hover">
                → REGISTER NOW
              </a>
              <a href="#contact" className="btn-ghost">
                CONTACT ORGANISER
              </a>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              EVENT_SPECIFICATIONS
            </div>
            <div className="mt-6 divide-y divide-hairline border-y border-hairline">
              {[
                { k: "DATE", v: "OCT 25, 2026" },
                { k: "TIME", v: "10:00 — 16:00" },
                { k: "LOCATION", v: "COMPUTER LAB 01" },
                { k: "FORMAT", v: "SQUAD // 4v4" },
                { k: "SEATS", v: "32 OPERATORS" },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between py-3 font-mono text-xs uppercase tracking-[0.16em]">
                  <span className="text-muted-foreground">{row.k}</span>
                  <span className="text-foreground">{row.v}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 border border-signal p-4 font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
              ⚠ REGISTRATION CLOSES 24H BEFORE START
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section id="team" className="border-b border-hairline">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="eyebrow">04 // OPERATORS</div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              MEET THE TEAM
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              The core unit running ARCHERS — students building the association from the ground up.
            </p>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            HEADCOUNT: <span className="text-signal">{TEAM.length}</span> · CYCLE 2026
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-0 border border-hairline sm:grid-cols-3 lg:grid-cols-4">
          {TEAM.map((m, i) => (
            <div
              key={m.name}
              className={`group relative p-6 transition-colors hover:bg-surface ${
                i % 2 === 1 ? "border-l border-hairline" : ""
              } ${i >= 2 ? "border-t border-hairline" : ""} sm:!border-l sm:[&:nth-child(3n+1)]:!border-l-0 sm:[&:nth-child(-n+3)]:!border-t-0 lg:!border-l lg:[&:nth-child(4n+1)]:!border-l-0 lg:[&:nth-child(-n+4)]:!border-t-0`}
            >
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                <span className="text-signal">
                  #{String(i + 1).padStart(2, "0")}
                </span>
                <span>OPR</span>
              </div>
              <div className="mt-6 flex h-24 w-24 items-center justify-center border border-hairline bg-background font-display text-2xl font-bold tracking-wider text-foreground transition-colors group-hover:border-signal group-hover:text-signal">
                {initials(m.name)}
              </div>
              <div className="mt-5 font-display text-base font-semibold text-foreground">
                {m.name}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {m.role}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  return (
    <section className="border-b border-hairline bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="eyebrow">05 // TRAJECTORY</div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          ASSOCIATION ROADMAP
        </h2>

        <div className="mt-14 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-hairline md:left-1/2" aria-hidden />
          <div className="space-y-10">
            {ROADMAP.map((r, i) => (
              <div key={r.tag} className="relative grid gap-4 pl-12 md:grid-cols-2 md:gap-16 md:pl-0">
                <div
                  className={`absolute left-[10px] top-2 h-3 w-3 border-2 border-signal bg-background md:left-1/2 md:-translate-x-1/2`}
                  aria-hidden
                />
                <div className={i % 2 === 0 ? "md:text-right md:pr-16" : "md:col-start-2 md:pl-16"}>
                  <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                    {r.tag} · {r.status}
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-bold text-foreground">
                    {r.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section id="community" className="relative overflow-hidden border-b border-hairline">
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-5 py-24 text-center md:px-8 md:py-36">
        <div className="eyebrow">06 // ENLIST</div>
        <h2 className="mt-6 font-display text-4xl font-bold leading-[0.95] tracking-tight text-foreground md:text-7xl">
          READY TO ENGINEER
          <br />
          THE <span className="text-signal">FUTURE?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Become part of a student community dedicated to learning, building, and innovating
          together. Bring the curiosity — we'll bring the tooling.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a href="#contact" className="btn-brutal btn-brutal-hover">
            → JOIN ARCHERS
          </a>
          <a href="#about" className="btn-ghost">
            LEARN MORE
          </a>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };
  return (
    <section id="contact" className="border-b border-hairline">
      <div className="mx-auto grid max-w-7xl gap-0 border-x border-hairline md:grid-cols-[1fr_1.2fr]">
        <div className="border-b border-hairline bg-surface p-8 md:border-b-0 md:border-r md:p-14">
          <div className="eyebrow">07 // TRANSMIT</div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            GET IN TOUCH
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Questions about workshops, events, or joining the community? Send a signal — the team
            reviews inbound messages weekly.
          </p>
          <div className="mt-10 space-y-4 font-mono text-xs uppercase tracking-[0.2em]">
            <div>
              <div className="text-muted-foreground">CHANNEL</div>
              <div className="mt-1 text-foreground">archers@gptcattingal.in</div>
            </div>
            <div>
              <div className="text-muted-foreground">BASE</div>
              <div className="mt-1 text-foreground">GPTC ATTINGAL · KERALA · IN</div>
            </div>
            <div>
              <div className="text-muted-foreground">DIVISION</div>
              <div className="mt-1 text-foreground">COMPUTER SCIENCE &amp; TECHNOLOGY</div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-8 md:p-14">
          <div className="grid gap-6">
            <label className="block">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                NAME
              </span>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="Enter your name"
                className="mt-2 block w-full border border-hairline bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                EMAIL ADDRESS
              </span>
              <input
                type="email"
                required
                maxLength={120}
                placeholder="yourname@example.com"
                className="mt-2 block w-full border border-hairline bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                MESSAGE
              </span>
              <textarea
                required
                rows={5}
                maxLength={1000}
                placeholder="Enter your message"
                className="mt-2 block w-full resize-none border border-hairline bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {sent ? (
                  <span className="text-signal">✓ TRANSMISSION_QUEUED</span>
                ) : (
                  "ENCRYPTED_ON_TRANSPORT"
                )}
              </div>
              <button type="submit" className="btn-brutal btn-brutal-hover">
                → CONTACT US
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <div className="font-display text-xl font-bold tracking-[0.18em] text-foreground">
                ARCHERS
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Technical command for the CS &amp; Technology students of Government Polytechnic
              College, Attingal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {[
              {
                head: "NAVIGATE",
                items: [
                  ["Manifesto", "#about"],
                  ["Workshops", "#workshops"],
                  ["Events", "#events"],
                  ["Team", "#team"],
                ],
              },
              {
                head: "COMMUNITY",
                items: [
                  ["Join", "#community"],
                  ["Contact", "#contact"],
                ],
              },
              {
                head: "REFERENCES",
                items: [
                  ["Documentation", "#"],
                  ["GitHub", "#"],
                  ["Archive", "#"],
                ],
              },
            ].map((col) => (
              <div key={col.head}>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal">
                  {col.head}
                </div>
                <ul className="mt-4 space-y-2">
                  {col.items.map(([label, href]) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-hairline pt-6 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© 2026 ARCHERS TECHNICAL COMMAND · ALL RIGHTS RESERVED</div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 bg-signal animate-pulse" />
            SYS.STATUS: NOMINAL
          </div>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <TickerBar />
      <Manifesto />
      <Workshops />
      <PriorityEvent />
      <Team />
      <Roadmap />
      <ClosingCTA />
      <Contact />
      <Footer />
    </main>
  );
}
