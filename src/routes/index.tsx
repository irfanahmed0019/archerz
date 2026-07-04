import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import archLogo from "@/assets/arch-logo.png.asset.json";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import bannerWorkshops from "@/assets/banner-workshops.jpg";
import miniMilitia from "@/assets/mini-militia.avif.asset.json";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [{ property: "og:url", content: "/" }],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Index() {
  // Always land on the top of the page. If a stray hash brought us here,
  // strip it so refreshes don't punt users to the footer.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
    // Boot the noart-style motion stack (Lenis + cursor + scramble + mask reveal)
    import("@/lib/motion").then((m) => m.startMotion());
  }, []);

  return (
    <div className="relative bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <TickerBand />
        <Manifesto />
        <Workshops />
        <PriorityEvent />
        <Team />
        <Roadmap />
        <ClosingCTA />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

// --- 3D tilt: mouse-driven perspective for cards/banners ---
function useTilt<T extends HTMLElement>(max = 8) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1200px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
    };
    const onLeave = () => {
      el.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [max]);
  return ref;
}

// --- scroll parallax: translate an element as it enters/leaves viewport ---
function useParallax<T extends HTMLElement>(strength = 0.2) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2 - window.innerHeight / 2;
        el.style.transform = `translate3d(0, ${(-center * strength).toFixed(1)}px, 0) scale(1.08)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return ref;
}

// --- reveal on scroll ---
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.revealed = "true";
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

const NAV_LINKS = [
  { href: "#workshops", label: "Workshops" },
  { href: "#events", label: "Events" },
  { href: "#team", label: "Team" },
  { href: "#community", label: "Community" },
];

const PILLARS = [
  {
    tag: "01",
    kicker: "LEARN",
    title: "Beyond the classroom.",
    body: "Practical, hands-on experience — sessions that meet you where you are and push where you're going.",
  },
  {
    tag: "02",
    kicker: "BUILD",
    title: "Ideas into artefacts.",
    body: "Real projects with real tooling. Ship things you're proud to put your name on.",
  },
  {
    tag: "03",
    kicker: "INNOVATE",
    title: "Tomorrow's stack, today.",
    body: "Explore emerging tech and solve problems that don't already have a Stack Overflow answer.",
  },
];

const WORKSHOPS = [
  {
    id: "MOD_01",
    title: "DESIGN WITH AI",
    body: "Create websites, interfaces, and digital experiences using modern AI-powered design tools.",
    date: "OCT 12",
    duration: "3H",
    status: "OPEN",
  },
  {
    id: "MOD_02",
    title: "TYPING SPEED CHALLENGE",
    body: "Test your typing speed, accuracy, and consistency in a competitive real-time environment.",
    date: "OCT 17",
    duration: "2H",
    status: "OPEN",
  },
  {
    id: "MOD_03",
    title: "BLIND CODING CHALLENGE",
    body: "Test your ability to write accurate, functional code without seeing your screen.",
    date: "TBD",
    duration: "2H",
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
    title: "ARCHERZ LAUNCH",
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

function LogoMark({ size = 28, invert = false }: { size?: number; invert?: boolean }) {
  return (
    <img
      src={archLogo.url}
      alt="ARCHERZ emblem"
      width={size}
      height={size}
      className="block"
      style={invert ? { filter: "invert(1)" } : undefined}
    />
  );
}

function Marquee({
  items,
  speed = "normal",
  size = "md",
}: {
  items: string[];
  speed?: "slow" | "normal" | "fast";
  size?: "sm" | "md" | "lg";
}) {
  const loop = [...items, ...items, ...items];
  const anim =
    speed === "slow"
      ? "animate-marquee-slow"
      : speed === "fast"
        ? "animate-marquee-fast"
        : "animate-marquee";
  const sizeCls =
    size === "lg"
      ? "text-4xl md:text-6xl font-display tracking-tight py-4"
      : size === "sm"
        ? "text-[11px] font-mono tracking-[0.24em] py-2"
        : "text-xs md:text-sm font-mono tracking-[0.22em] py-3";
  return (
    <div className="overflow-hidden">
      <div className={`flex whitespace-nowrap ${anim} ${sizeCls}`}>
        {loop.map((t, i) => (
          <span key={i} className="mx-6 md:mx-10 inline-flex items-center gap-6 md:gap-10">
            <span>{t}</span>
            <span className="inline-block h-1.5 w-1.5 shrink-0 bg-signal" />
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
      className={`fixed inset-x-0 top-0 z-50 transition-all ${
        scrolled
          ? "border-b border-hairline bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3.5 md:px-10">
        <a href="#top" className="group flex items-baseline gap-1">
          <LogoMark size={26} invert={false} />
          <span className="font-display text-base tracking-[0.24em] text-foreground translate-y-[2px]">
            rcherz
          </span>
          <span className="hidden font-mono text-[10px] tracking-[0.24em] text-muted-foreground md:inline pl-2">
            /GPTC · '26
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-signal transition-all group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="#community" className="hidden btn-brutal btn-brutal-hover md:inline-flex" data-cursor-hover>
            → ENLIST
          </a>
          <button
            aria-label="Toggle menu"
            className="btn-ghost md:hidden !px-3 !py-2"
            data-cursor-hover
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
                className="border-b border-hairline py-3 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#community"
              onClick={() => setOpen(false)}
              className="btn-brutal btn-brutal-hover mt-3 justify-center"
            >
              → ENLIST
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  const parallax = useParallax<HTMLImageElement>(0.15);
  const tilt = useTilt<HTMLDivElement>(6);
  return (
    <section id="top" className="relative min-h-screen overflow-hidden [perspective:1400px]">
      {/* Backdrop image with scroll parallax */}
      <img
        ref={parallax}
        src={heroBackdrop}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-multiply grayscale will-change-transform"
      />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.5]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 70%, transparent 0%, color-mix(in oklab, var(--color-background) 70%, transparent) 55%, var(--color-background) 92%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-15" aria-hidden />

      {/* Top strip */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-24 md:px-10 md:pt-28 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 bg-signal animate-pulse" />
          GPTC ATTINGAL · KERALA
        </div>
        <div className="hidden md:block">CS &amp; TECHNOLOGY · CYCLE '26</div>
        <div className="text-foreground">'26</div>
      </div>

      {/* Hero centerpiece */}
      <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col items-center px-5 pb-16 pt-16 text-center md:px-10 md:pt-24 md:pb-24">
        {/* Bracket-framed logo — tilt on hover */}
        <div ref={tilt} className="hero-frame p-6 md:p-10 transition-transform duration-200 will-change-transform [transform-style:preserve-3d]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div
                className="absolute inset-0 -z-10 blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in oklab, var(--color-signal) 35%, transparent) 0%, transparent 70%)",
                }}
                aria-hidden
              />
              <div className="flex items-baseline gap-2 [transform:translateZ(40px)]">
                <LogoMark size={110} invert={false} />
                <span className="font-display text-6xl md:text-7xl tracking-tight text-foreground">rcherz</span>
              </div>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-muted-foreground" data-scramble>
              [ ASSN. OF CS &amp; TECH · GPTC · EST. 2026 ]
            </div>
          </div>
        </div>

        <h1 className="mt-10 max-w-5xl font-display text-[15vw] leading-[0.85] tracking-tight text-foreground md:text-[9.5rem]">
          <span data-reveal="mask"><span>ENGINEER</span></span>
          <br />
          <span data-reveal="mask"><span className="italic font-serif text-signal font-normal">the future</span></span>
        </h1>

        <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          The student association for Computer Science and Technology at Government
          Polytechnic College, Attingal. Workshops, competitions, and side projects
          run by students, for students.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a href="#community" className="btn-brutal btn-brutal-hover" data-cursor-hover data-cursor-text="JOIN">
            → JOIN ARCHERZ
          </a>
          <a href="#events" className="btn-ghost" data-cursor-hover data-cursor-text="EVENTS">
            SEE EVENTS
          </a>
        </div>

        <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-hairline pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <div className="text-left">
            <div className="text-signal">CHAPTER</div>
            <div className="mt-1 text-foreground">GPTC ATTINGAL</div>
          </div>
          <div className="text-center">
            <div className="text-signal">BRANCH</div>
            <div className="mt-1 text-foreground">CS &amp; TECH</div>
          </div>
          <div className="text-right">
            <div className="text-signal">STATUS</div>
            <div className="mt-1 text-foreground">RECRUITING</div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
        ↓ SCROLL
      </div>
    </section>
  );
}

function TickerBand() {
  return (
    <div className="relative border-y border-hairline bg-background text-foreground">
      <Marquee
        size="sm"
        items={[
          ">> SYSTEM ONLINE",
          "MULTI-DISCIPLINE MODULES ACTIVE",
          "ACCESS GRANTED",
          "ARCHERZ '26",
          "GPTC ATTINGAL",
          "CS · TECHNOLOGY DIVISION",
          "LEARN / BUILD / INNOVATE",
        ]}
      />
    </div>
  );
}

function DisplayMarquee({ text }: { text: string }) {
  const items = Array(8).fill(text);
  return (
    <div className="border-y border-hairline bg-background py-4">
      <Marquee items={items} size="lg" speed="slow" />
    </div>
  );
}

function Manifesto() {
  return (
    <section id="about" className="relative overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-36">
        {/* Section header */}
        <div className="flex flex-col gap-6 border-b border-hairline pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
              01 // THE IDENTITY
            </div>
            <h2 className="mt-6 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-7xl">
              Not just an
              <br />
              <span className="italic font-serif font-normal text-muted-foreground">
                association.
              </span>
            </h2>
          </div>
          <div className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Move beyond textbooks and start creating. From workshops to real-world projects,
            ARCHERZ is where students learn, build, and grow together.
          </div>
        </div>

        {/* Pillars */}
        <div className="mt-16 grid gap-0 border border-hairline md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <div
              key={p.tag}
              className={`relative flex flex-col justify-between p-8 md:p-12 ${
                i < PILLARS.length - 1 ? "border-b border-hairline md:border-b-0 md:border-r" : ""
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em]">
                <span className="text-signal">{p.tag}</span>
                <span className="text-muted-foreground">PILLAR</span>
              </div>
              <div className="mt-14">
                <div className="font-mono text-[10px] uppercase tracking-[0.36em] text-signal">
                  {p.kicker}
                </div>
                <h3 className="mt-3 font-serif italic text-3xl leading-tight text-foreground md:text-4xl">
                  {p.title}
                </h3>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workshops() {
  return (
    <section id="workshops" className="relative">
      {/* Cinematic banner */}
      <div className="relative overflow-hidden border-y border-hairline">
        <img
          src={bannerWorkshops}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--color-background) 45%, transparent) 0%, color-mix(in oklab, var(--color-background) 20%, transparent) 40%, color-mix(in oklab, var(--color-background) 85%, transparent) 100%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-[1400px] flex-col items-center justify-center px-5 py-28 text-center md:px-10 md:py-40">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
            [ 02 // TRAINING INTERFACE ACTIVE ]
          </div>
          <h2 className="mt-6 font-display text-6xl leading-[0.9] tracking-tight text-foreground md:text-[9rem]">
            UPGRADE
            <br />
            <span className="italic font-serif font-normal">your skills.</span>
          </h2>
          <a href="#workshops-list" className="btn-brutal btn-brutal-hover mt-10" data-cursor-hover>
            ↗ ENTER THE ARENA
          </a>
        </div>
      </div>

      {/* Ticker */}
      <div className="border-b border-hairline bg-background">
        <Marquee
          size="sm"
          speed="fast"
          items={[
            ">> TRAINING INTERFACE ACTIVE",
            "CORE MODULES DEPLOYED",
            "INITIATE BUILD SEQUENCE",
            "MOD_01 · MOD_02 · MOD_03",
          ]}
        />
      </div>

      {/* Module list */}
      <div id="workshops-list" className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h3 className="font-display text-3xl tracking-tight text-foreground md:text-5xl">
            TECHNICAL WORKSHOPS
          </h3>
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            [ BUILDING SKILLS BEYOND CLASSROOMS ]
          </div>
        </div>

        <div className="mt-12 border-t border-hairline">
          {WORKSHOPS.map((w) => (
            <a
              key={w.id}
              href="#community"
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 border-b border-hairline py-8 transition-colors hover:bg-surface md:grid-cols-[120px_1fr_120px_140px_auto] md:gap-8 md:py-10 md:px-6"
            >
              <div className="font-mono text-xs uppercase tracking-[0.24em] text-signal">
                {w.id}
              </div>
              <div>
                <div className="font-display text-2xl leading-tight text-foreground md:text-4xl">
                  {w.title}
                </div>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {w.body}
                </p>
              </div>
              <div className="hidden md:block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <div className="text-signal">DATE</div>
                <div className="mt-1 text-foreground">{w.date}</div>
              </div>
              <div className="hidden md:block font-mono text-xs uppercase tracking-[0.2em]">
                <span
                  className={`inline-flex px-2 py-1 border ${
                    w.status === "OPEN"
                      ? "border-signal text-signal"
                      : "border-hairline text-muted-foreground"
                  }`}
                >
                  {w.status}
                </span>
              </div>
              <div className="font-mono text-2xl text-signal transition-transform group-hover:translate-x-2">
                ↗
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function PriorityEvent() {
  const tilt = useTilt<HTMLDivElement>(10);
  return (
    <section id="events" className="relative border-y border-hairline bg-background">
      {/* Blurred poster ambience */}
      <img
        src={miniMilitia.url}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 blur-2xl"
        loading="lazy"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--color-background) 55%, transparent) 0%, color-mix(in oklab, var(--color-background) 65%, transparent) 40%, var(--color-background) 100%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-36 [perspective:1400px]">
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.28em]">
          <div className="text-signal">[ 03 // FLAGSHIP EVENT ]</div>
          <div className="text-muted-foreground">
            TYPE: <span className="text-foreground">ESPORTS</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="sticker" style={{ transform: "rotate(-3deg)" }}>
            ● LIVE '26
          </span>
          <span className="sticker" style={{ transform: "rotate(2deg)" }}>
            OCT · 25
          </span>
          <span className="sticker" style={{ transform: "rotate(-1deg)" }}>
            10:00 → 16:00
          </span>
        </div>

        <h2 className="mt-10 font-display text-[16vw] leading-[0.85] tracking-tighter text-foreground md:text-[13rem]">
          MINI
          <br />
          <span className="italic font-serif font-normal text-signal">militia.</span>
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-start">
          {/* Poster with 3D tilt */}
          <div
            ref={tilt}
            className="relative border border-hairline bg-surface transition-transform duration-200 will-change-transform [transform-style:preserve-3d]"
          >
            <img
              src={miniMilitia.url}
              alt="Mini Militia tournament poster"
              className="block h-auto w-full object-cover"
              loading="lazy"
            />
            <div className="absolute left-0 top-0 sticker m-3" style={{ transform: "rotate(-4deg)" }}>
              ARCHERZ · PRESENTS
            </div>
            <div className="absolute right-0 bottom-0 sticker m-3" style={{ transform: "rotate(3deg)" }}>
              32 SEATS
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Squad up. 4v4 mobile combat, live scoreboard, one lab, one afternoon.
              Bring your own device. Winner takes the pot. Losers get pizza.
            </p>

            <div className="panel p-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">
                EVENT SPECS
              </div>
              <div className="mt-4 divide-y divide-hairline">
                {[
                  ["DATE", "OCT 25, 2026"],
                  ["TIME", "10:00 — 16:00"],
                  ["LOCATION", "COMPUTER LAB 01"],
                  ["FORMAT", "SQUAD · 4v4"],
                  ["SEATS", "32 PLAYERS"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5 font-mono text-[11px] uppercase tracking-[0.18em]">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-foreground">{v}</span>
                  </div>
                ))}
              </div>
              <a href="#community" className="btn-brutal btn-brutal-hover mt-6 w-full justify-center" data-cursor-hover>
                → REGISTER
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Under-ticker */}
      <div className="bg-background">
        <Marquee
          size="lg"
          speed="slow"
          items={["REGISTER NOW", "MINI MILITIA '26", "SQUAD 4v4", "OCT 25", "ENTER THE ARENA"]}
        />
      </div>
    </section>
  );
}

function Team() {
  return (
    <section id="team" className="relative border-t border-hairline">
      <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-col gap-6 border-b border-hairline pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
              04 // OPERATORS
            </div>
            <h2 className="mt-6 font-display text-5xl leading-[0.9] tracking-tight text-foreground md:text-7xl">
              Meet the
              <br />
              <span className="italic font-serif font-normal text-muted-foreground">unit.</span>
            </h2>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            HEADCOUNT · <span className="text-signal">{TEAM.length}</span> · CYCLE 2026
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-0 border border-hairline sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m, i) => (
            <div
              key={m.name}
              className="group relative flex flex-col justify-between p-6 md:p-8 border-t border-l border-hairline first:border-t-0 sm:[&:nth-child(-n+2)]:border-t-0 lg:[&:nth-child(-n+4)]:border-t-0 [&:nth-child(odd)]:border-l-0 sm:[&:nth-child(2n+1)]:border-l-0 lg:[&:nth-child(4n+1)]:border-l-0 lg:[&:nth-child(odd)]:border-l"
            >
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em]">
                <span className="text-signal">#{String(i + 1).padStart(2, "0")}</span>
                <span className="text-muted-foreground">OPR</span>
              </div>
              <div className="mt-8 flex h-28 w-28 items-center justify-center border border-hairline bg-surface font-display text-3xl text-foreground transition-colors group-hover:border-signal group-hover:text-signal">
                {initials(m.name)}
              </div>
              <div className="mt-6">
                <div className="font-serif italic text-2xl leading-tight text-foreground">
                  {m.name}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  {m.role}
                </div>
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
    <section className="relative border-t border-hairline bg-surface">
      <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
          05 // TRAJECTORY
        </div>
        <h2 className="mt-6 max-w-3xl font-display text-5xl leading-[0.9] tracking-tight text-foreground md:text-7xl">
          Association
          <br />
          <span className="italic font-serif font-normal text-muted-foreground">roadmap.</span>
        </h2>

        <div className="mt-16 grid gap-0 border border-hairline bg-background md:grid-cols-3">
          {ROADMAP.map((r, i) => (
            <div
              key={r.tag}
              className={`relative p-8 md:p-10 ${
                i < ROADMAP.length - 1 ? "border-b border-hairline md:border-b-0 md:border-r" : ""
              }`}
            >
              <div className="font-display text-7xl text-hairline md:text-8xl">
                0{i + 1}
              </div>
              <div className="mt-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em]">
                <span className="text-signal">{r.tag}</span>
                <span className="text-muted-foreground">{r.status}</span>
              </div>
              <h3 className="mt-5 font-display text-2xl leading-tight text-foreground md:text-3xl">
                {r.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section id="community" className="relative overflow-hidden border-t border-hairline">
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--color-signal) 22%, transparent) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-5 py-28 text-center md:px-10 md:py-40">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
          06 // ENLIST
        </div>
        <h2 className="mt-8 font-display text-6xl leading-[0.85] tracking-tight text-foreground md:text-9xl">
          Ready to
          <br />
          <span className="italic font-serif font-normal text-signal">engineer</span>
          <br />
          the future?
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Become part of a student community dedicated to learning, building, and innovating
          together. Bring the curiosity — we'll bring the tooling.
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <a href="#contact" className="btn-brutal btn-brutal-hover" data-cursor-hover>
            → JOIN ARCHERZ
          </a>
          <a href="#about" className="btn-ghost" data-cursor-hover>
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
    <section id="contact" className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1400px] gap-0 md:grid-cols-[1fr_1.2fr]">
        <div className="border-b border-hairline bg-surface p-8 md:border-b-0 md:border-r md:p-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
            07 // TRANSMIT
          </div>
          <h2 className="mt-6 font-display text-5xl leading-[0.9] tracking-tight text-foreground md:text-6xl">
            Get in
            <br />
            <span className="italic font-serif font-normal text-muted-foreground">touch.</span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Questions about workshops, events, or joining the community? Send a signal — the team
            reviews inbound messages weekly.
          </p>
          <div className="mt-10 space-y-5 font-mono text-xs uppercase tracking-[0.2em]">
            {[
              ["CHANNEL", "archerz@gptcattingal.in"],
              ["BASE", "GPTC ATTINGAL · KERALA · IN"],
              ["DIVISION", "COMPUTER SCIENCE & TECHNOLOGY"],
            ].map(([k, v]) => (
              <div key={k} className="border-l-2 border-signal pl-4">
                <div className="text-muted-foreground">{k}</div>
                <div className="mt-1 text-foreground">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-8 md:p-16">
          <div className="grid gap-6">
            {[
              { label: "NAME", type: "text", placeholder: "Enter your name", max: 80 },
              { label: "EMAIL ADDRESS", type: "email", placeholder: "yourname@example.com", max: 120 },
            ].map((f) => (
              <label key={f.label} className="block">
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                  {f.label}
                </span>
                <input
                  type={f.type}
                  required
                  maxLength={f.max}
                  placeholder={f.placeholder}
                  className="mt-2 block w-full border-b border-hairline bg-transparent px-1 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none"
                />
              </label>
            ))}
            <label className="block">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                MESSAGE
              </span>
              <textarea
                required
                rows={5}
                maxLength={1000}
                placeholder="Enter your message"
                className="mt-2 block w-full resize-none border-b border-hairline bg-transparent px-1 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none"
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {sent ? (
                  <span className="text-signal">✓ TRANSMISSION_QUEUED</span>
                ) : (
                  "ENCRYPTED_ON_TRANSPORT"
                )}
              </div>
              <button type="submit" className="btn-brutal btn-brutal-hover" data-cursor-hover>
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
    <footer className="relative border-t border-hairline bg-background">
      {/* Huge wordmark */}
      <div className="mx-auto max-w-[1400px] px-5 pt-16 md:px-10 md:pt-24">
        <div className="font-display text-[22vw] leading-[0.8] tracking-tighter text-foreground md:text-[16rem]">
          ARCHERZ<span className="text-signal">.</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-10 md:px-10">
        <div className="grid gap-10 border-t border-hairline pt-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark size={30} />
              <div className="font-display text-lg tracking-[0.18em] text-foreground">
                ARCHERZ
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Technical command for the CS &amp; Technology students of Government Polytechnic
              College, Attingal.
            </p>
          </div>

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
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-signal">
                {col.head}
              </div>
              <ul className="mt-5 space-y-3">
                {col.items.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label} <span className="text-signal">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-hairline pt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© 2026 ARCHERZ TECHNICAL COMMAND · ALL RIGHTS RESERVED</div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 bg-signal animate-pulse" />
            SYS.STATUS · NOMINAL
          </div>
        </div>
      </div>
    </footer>
  );
}

