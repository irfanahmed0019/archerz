import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import archLogo from "@/assets/arch-logo.png";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import bannerWorkshops from "@/assets/banner-workshops.jpg";
import miniMilitia from "@/assets/mini-militia.avif";
import { supabase } from "@/integrations/supabase/client";



export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { property: "og:url", content: "https://archerz.lovable.app/" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/254c9f37-8b8e-44f7-808a-a6064dfb0630/id-preview-9a632a29--f121f496-ded9-4590-a2e5-02383200aff0.lovable.app-1783186168226.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/254c9f37-8b8e-44f7-808a-a6064dfb0630/id-preview-9a632a29--f121f496-ded9-4590-a2e5-02383200aff0.lovable.app-1783186168226.png" },
    ],
    links: [
      { rel: "canonical", href: "https://archerz.lovable.app/" },
      // Preload nav emblem + hero art so the header never flickers on slow connections
      { rel: "preload", as: "image", href: archLogo, fetchpriority: "high" },
      { rel: "preload", as: "image", href: heroBackdrop, fetchpriority: "high" },
      { rel: "preload", as: "image", href: miniMilitia },
    ],
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
    <div className="relative bg-background text-foreground has-mobile-dock">
      <PageTransition />
      <Nav />
      <main>
        {/* 1. HERO — one-line message + primary CTA */}
        <Hero />
        <TickerBand />
        {/* 2. WHAT WE DO — answers "what is this?" */}
        <Manifesto />
        {/* 3. WHAT'S IN IT FOR YOU — answers "why should I care?" */}
        <WhyJoin />
        {/* 4. WHAT'S NEXT — the featured event, the reason to act now */}
        <PriorityEvent />
        {/* 5. PROOF — shipped/upcoming workshops */}
        <Workshops />
        {/* 6. THE PEOPLE — trust through faces */}
        <Team />
        {/* 7. TRAJECTORY — trust through track record */}
        <Roadmap />
        {/* 8. NEXT STEP — clear single action */}
        <ClosingCTA />
        <Contact />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}


function PageTransition() {
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const DURATION = 1600;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setPct(Math.floor(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setGone(true), 350);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] flex flex-col bg-foreground text-background overflow-hidden ${
        pct >= 100 ? "animate-page-curtain pointer-events-none" : ""
      }`}
    >
      {/* scanlines */}
      <div className="absolute inset-0 scanlines opacity-40" />
      {/* blueprint grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* vermillion sweep */}
      <div
        className="absolute inset-y-0 left-0 bg-signal/25 mix-blend-screen"
        style={{ width: `${pct}%`, transition: "width 60ms linear" }}
      />

      {/* top bar */}
      <div className="relative flex items-center justify-between px-6 py-4 font-mono text-[10px] uppercase tracking-[0.3em] border-b border-background/20">
        <span>ARCHERZ // BOOT</span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-blink" />
          SIGNAL ACQUIRED
        </span>
      </div>

      {/* center */}
      <div className="relative flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-3xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-signal">
            /GPTC · ATTINGAL · '26
          </div>
          <div
            className="mt-3 font-display uppercase leading-[0.9] tracking-tight"
            style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}
          >
            <span className="block">ARCH<span className="text-stroke-signal">ERZ</span></span>
          </div>

          {/* progress */}
          <div className="mt-10">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-background/70">
              <span>LOADING SIGNAL</span>
              <span className="tabular-nums">{String(pct).padStart(3, "0")}%</span>
            </div>
            <div className="mt-2 h-[3px] w-full bg-background/15 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-signal"
                style={{ width: `${pct}%`, transition: "width 60ms linear" }}
              />
            </div>

            {/* status stream */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-background/60">
              {[
                ["INIT", 10],
                ["FONTS", 30],
                ["MOTION", 55],
                ["CURSOR", 70],
                ["GRID", 82],
                ["WORKSHOPS", 90],
                ["TEAM", 96],
                ["READY", 100],
              ].map(([label, at]) => (
                <div
                  key={label as string}
                  className={`flex items-center gap-2 transition-colors ${
                    pct >= (at as number) ? "text-background" : "text-background/30"
                  }`}
                >
                  <span>{pct >= (at as number) ? "▣" : "▢"}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="relative flex items-center justify-between px-6 py-4 font-mono text-[10px] uppercase tracking-[0.3em] border-t border-background/20">
        <span>CS · TECH · ASSOCIATION</span>
        <span>V26.0</span>
      </div>
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
  { href: "#about", label: "About" },
  { href: "#events", label: "Events" },
  { href: "#workshops", label: "Workshops" },
  { href: "#team", label: "Team" },
  { href: "#contact", label: "Contact" },
];

const BENEFITS = [
  { tag: "01", title: "Practical Workshops", body: "Hands-on sessions on tools and stacks you'll actually use." },
  { tag: "02", title: "Real Projects", body: "Ship things with a team — not just assignments." },
  { tag: "03", title: "Leadership", body: "Run events, lead tracks, own a domain end-to-end." },
  { tag: "04", title: "Networking", body: "Peers, seniors, alumni, and industry — one room." },
  { tag: "05", title: "Technical Growth", body: "Level up beyond the syllabus at your own pace." },
  { tag: "06", title: "Community", body: "A crew that debugs with you at 2AM. Literally." },
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
      src={archLogo}
      alt="ARCHERZ emblem"
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      // @ts-expect-error fetchpriority is a valid HTML attribute
      fetchpriority="high"
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

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string>(ids[0] ?? "");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        }
        let best = ids[0];
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) { best = id; bestRatio = ratio; }
        }
        if (bestRatio > 0) setActive(best);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids.join("|")]);
  return active;
}

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(NAV_LINKS.map((l) => l.href.replace("#", "")));

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
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3.5 md:px-10 lg:px-14 xl:px-16">
        <a href="#top" className="group flex items-baseline gap-1 tap-target">
          <LogoMark size={26} invert={false} />
          <span className="font-display text-base tracking-[0.24em] text-foreground translate-y-[2px]">
            rcherz
          </span>
          <span className="hidden font-mono text-[10px] tracking-[0.24em] text-muted-foreground md:inline pl-2">
            {"\n"}
          </span>
        </a>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((l) => {
            const isActive = active === l.href.replace("#", "");
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={isActive ? "true" : undefined}
                className={`link-quiet font-mono text-[11px] uppercase tracking-[0.24em] transition-colors ${
                  isActive ? "text-signal" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </nav>


        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden btn-brutal btn-brutal-hover md:inline-flex" data-cursor-hover>
            → LOGIN
          </Link>
          <button
            aria-label="Toggle menu"
            className="btn-ghost md:hidden tap-target !px-3 !py-2"
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
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="btn-brutal btn-brutal-hover mt-3 justify-center"
            >
              → LOGIN
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileBottomNav() {
  return (
    <nav
      aria-label="Primary mobile navigation"
      className="mobile-dock md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 items-stretch">
        {[
          { href: "#top", label: "Home", icon: "◈" },
          { href: "#events", label: "Events", icon: "◆" },
          { href: "#community", label: "Join", icon: "→", primary: true },
          { href: "#menu-sheet", label: "Menu", icon: "≡", sheet: true },
        ].map((item) => (
          <li key={item.label} className="contents">
            <a
              href={item.href}
              className={`tap-target flex flex-col items-center justify-center gap-1 py-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                item.primary
                  ? "text-signal"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={item.sheet ? (e) => {
                e.preventDefault();
                const el = document.getElementById("archerz-mobile-sheet");
                if (el) el.dataset.open = el.dataset.open === "true" ? "false" : "true";
              } : undefined}
            >
              <span aria-hidden className={`text-lg ${item.primary ? "" : ""}`}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>

      {/* Slide-up sheet for the rest of the destinations */}
      <div
        id="archerz-mobile-sheet"
        data-open="false"
        className="pointer-events-none fixed inset-x-0 bottom-[72px] z-[59] translate-y-4 opacity-0 transition-all duration-300 data-[open=true]:pointer-events-auto data-[open=true]:translate-y-0 data-[open=true]:opacity-100"
      >
        <div className="mx-3 mb-3 rounded-none border border-hairline bg-background p-4 shadow-[6px_6px_0_0_var(--color-foreground)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-signal mb-3">
            [ MORE ]
          </div>
          <div className="grid gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => {
                  const el = document.getElementById("archerz-mobile-sheet");
                  if (el) el.dataset.open = "false";
                }}
                className="tap-target flex items-center justify-between border-b border-hairline py-3 font-mono text-xs uppercase tracking-[0.24em] text-foreground"
              >
                <span>{l.label}</span>
                <span className="text-signal">↗</span>
              </a>
            ))}
            <Link
              to="/auth"
              className="tap-target mt-3 flex items-center justify-center border border-foreground bg-foreground px-4 py-3 font-mono text-xs uppercase tracking-[0.24em] text-background"
            >
              → LOGIN
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const parallax = useParallax<HTMLImageElement>(0.15);
  return (
    <section id="top" className="relative min-h-screen overflow-hidden bg-background flex flex-col">
      {/* Backdrop */}
      <img
        ref={parallax}
        src={heroBackdrop}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply grayscale will-change-transform"
      />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, transparent 0%, color-mix(in oklab, var(--color-background) 55%, transparent) 55%, var(--color-background) 95%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-10" aria-hidden />

      {/* Top strip */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-5 pt-24 md:px-10 md:pt-28 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] md:tracking-[0.24em] text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-block h-2 w-2 shrink-0 bg-signal animate-pulse" />
          <span className="truncate">GPTC ATTINGAL · KERALA</span>
        </div>
        <div className="hidden md:block">CS &amp; TECHNOLOGY · CYCLE '26</div>
        <div className="shrink-0 text-foreground">'26</div>
      </div>

      {/* Split wordmark centerpiece */}
      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pt-10 md:px-10 md:pt-16 flex-1 flex flex-col justify-center">
        <div className="relative flex items-center justify-center">
          <span
            className="font-display text-stroke leading-[0.85] tracking-[-0.04em] text-[16vw] md:text-[18vw] select-none animate-hero-in"
            style={{ animationDelay: "80ms" }}
          >
            ARCH
          </span>

          <div className="mx-2 md:mx-8 flex flex-col items-center gap-2 md:gap-3 shrink-0 animate-hero-in" style={{ animationDelay: "260ms" }}>
            <div className="md:hidden"><LogoMark size={38} /></div>
            <div className="hidden md:block"><LogoMark size={54} /></div>
            <span className="font-mono text-[8px] md:text-[10px] uppercase tracking-[0.32em] text-muted-foreground whitespace-nowrap">
              ( Association )
            </span>
          </div>

          <span
            className="font-display leading-[0.85] tracking-[-0.04em] text-foreground text-[16vw] md:text-[18vw] select-none animate-hero-in"
            style={{ animationDelay: "160ms" }}
          >
            ERZ
          </span>
        </div>

        {/* One-line value + CTAs — clear hero message, primary + secondary action */}
        <div className="mt-12 md:mt-16 grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end">
          <h1 className="font-display text-4xl leading-[0.95] tracking-tight text-foreground md:text-6xl">
            <span data-reveal="mask"><span>The CS &amp; Tech students'</span></span>{" "}
            <span data-reveal="mask"><span className="italic font-serif text-signal font-normal">association at GPTC Attingal.</span></span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base md:justify-self-end md:text-right">
            Workshops, projects, and events — built by students, for students. Beyond the classroom.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link to="/auth" className="btn-brutal btn-brutal-hover" data-cursor-hover data-cursor-text="JOIN">
            → JOIN ARCHERZ
          </Link>
          <a href="#events" className="btn-ghost" data-cursor-hover data-cursor-text="EVENTS">
            SEE WHAT'S ON
          </a>
          <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground pl-2">
            EST. 2026 · GPTC ATTINGAL
          </span>
        </div>
      </div>

      <div className="pointer-events-none relative z-10 pb-6 text-center font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
        ↓ SCROLL TO EXPLORE
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
              01 // WHAT WE DO
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
            We run workshops, ship real projects, and put on events for the CS &amp; Tech branch
            at GPTC Attingal. Everything student-led.
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

type LiveWorkshop = {
  id: string;
  slug: string;
  code: string;
  title: string;
  body: string;
  event_date: string | null;
  status: string;
};

function Workshops() {
  const [live, setLive] = useState<LiveWorkshop[] | null>(null);
  useEffect(() => {
    supabase
      .from("workshops")
      .select("id,slug,code,title,body,event_date,status,ordering,is_published")
      .eq("is_published", true)
      .order("ordering", { ascending: true })
      .then(({ data }) => {
        if (data) setLive(data as LiveWorkshop[]);
      });
  }, []);
  const list: LiveWorkshop[] =
    live ??
    WORKSHOPS.map((w) => ({
      id: w.id,
      slug: w.id.toLowerCase().replace(/_/g, "-"),
      code: w.id,
      title: w.title,
      body: w.body,
      event_date: w.date,
      status: w.status,
    }));
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
            [ 04 // TRAINING INTERFACE ACTIVE ]
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
          {list.slice(0, 3).map((w) => (
            <Link
              key={w.id}
              to="/workshops/$slug"
              params={{ slug: w.slug }}
              className="card-lift group grid grid-cols-[auto_1fr_auto] items-center gap-6 border-b border-hairline py-8 transition-colors hover:bg-surface md:grid-cols-[120px_1fr_120px_140px_auto] md:gap-10 md:py-12 md:px-8 lg:px-10 lg:py-14"
            >
              <div className="font-mono text-xs uppercase tracking-[0.24em] text-signal">
                {w.code}
              </div>
              <div className="min-w-0">
                <div className="font-display text-2xl leading-tight text-foreground md:text-4xl lg:text-[2.75rem]">
                  {w.title}
                </div>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:mt-3 md:text-[15px]">
                  {w.body}
                </p>
              </div>
              <div className="hidden md:block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <div className="text-signal">DATE</div>
                <div className="mt-1 text-foreground">{w.event_date ?? "TBD"}</div>
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
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a href="#events" className="btn-ghost" data-cursor-hover>
            → VIEW ALL EVENTS
          </a>
        </div>
      </div>
    </section>
  );
}

function WhyJoin() {
  return (
    <section id="why" className="relative border-t border-hairline bg-surface">
      <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-col gap-6 border-b border-hairline pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
              02 // WHY JOIN
            </div>
            <h2 className="mt-6 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-7xl">
              What's in it
              <br />
              <span className="italic font-serif font-normal text-muted-foreground">for you.</span>
            </h2>
          </div>
          <div className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Six reasons students join ARCHERZ — and stay through every cycle.
          </div>
        </div>

        <div className="mt-14 grid gap-0 border border-hairline bg-background md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <div
              key={b.tag}
              className={`group relative p-8 md:p-10 border-t border-l border-hairline [&:nth-child(-n+1)]:border-t-0 md:[&:nth-child(-n+2)]:border-t-0 lg:[&:nth-child(-n+3)]:border-t-0 [&:nth-child(odd)]:border-l-0 md:[&:nth-child(2n+1)]:border-l-0 md:[&:nth-child(odd)]:border-l lg:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(n)]:border-l`}
            >
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em]">
                <span className="text-signal">{b.tag}</span>
                <span className="text-muted-foreground">BENEFIT</span>
              </div>
              <h3 className="mt-10 font-display text-2xl leading-tight text-foreground md:text-3xl">
                {b.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
              <div className="mt-6 h-[2px] w-8 bg-signal transition-all duration-300 group-hover:w-16" />
              {/* preserve index for potential debug */}
              <span className="sr-only">{i}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


type FeaturedPoster = {
  title: string | null;
  image_url: string | null;
  event_date: string | null;
  duration: string | null;
  body: string | null;
  long_description: string | null;
  register_url: string | null;
  status: string | null;
};

function PriorityEvent() {
  const tilt = useTilt<HTMLDivElement>(10);
  const [featured, setFeatured] = useState<FeaturedPoster | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [workshopId, setWorkshopId] = useState<string | null>(null);


  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("workshops")
        .select("id,title,image_url,event_date,duration,body,long_description,register_url,status")
        .eq("is_featured", true)
        .eq("is_published", true)
        .maybeSingle();
      if (data) {
        setFeatured(data as FeaturedPoster);
        setWorkshopId((data as { id?: string }).id ?? null);
      }
    })();
  }, []);


  const posterSrc = featured?.image_url || miniMilitia;
  const rawTitle = featured?.title ?? "MINI militia.";
  const [titleHead, titleTail] = (() => {
    const parts = rawTitle.trim().split(/\s+/);
    if (parts.length < 2) return [parts[0] ?? rawTitle, ""];
    return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
  })();
  const dateLabel = featured?.event_date || "OCT · 25";
  const durationLabel = featured?.duration || "10:00 → 16:00";
  const description =
    featured?.long_description ||
    featured?.body ||
    "Squad up. 4v4 mobile combat, live scoreboard, one lab, one afternoon. Bring your own device. Winner takes the pot. Losers get pizza.";
  
  const statusLabel = (featured?.status || "OPEN").toUpperCase();

  return (
    <section id="events" className="relative border-y border-hairline bg-background">
      {/* Blurred poster ambience */}
      <img
        src={posterSrc}
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
            STATUS: <span className="text-foreground">{statusLabel}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="sticker" style={{ transform: "rotate(-3deg)" }}>
            ● LIVE '26
          </span>
          <span className="sticker" style={{ transform: "rotate(2deg)" }}>
            {dateLabel}
          </span>
          <span className="sticker" style={{ transform: "rotate(-1deg)" }}>
            {durationLabel}
          </span>
        </div>

        <h2 className="mt-10 font-display text-[16vw] leading-[0.85] tracking-tighter text-foreground md:text-[13rem]">
          {titleHead}
          {titleTail && (
            <>
              <br />
              <span className="italic font-serif font-normal text-signal">{titleTail}</span>
            </>
          )}
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-start">
          {/* Poster with 3D tilt */}
          <div
            ref={tilt}
            className="relative border border-hairline bg-surface transition-transform duration-200 will-change-transform [transform-style:preserve-3d]"
          >
            <img
              src={posterSrc}
              alt={featured?.title ? `${featured.title} poster` : "Mini Militia tournament poster"}
              className="block h-auto w-full object-cover"
              loading="lazy"
            />
            <div className="absolute left-0 top-0 sticker m-3" style={{ transform: "rotate(-4deg)" }}>
              ARCHERZ · PRESENTS
            </div>
            <div className="absolute right-0 bottom-0 sticker m-3" style={{ transform: "rotate(3deg)" }}>
              {statusLabel}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>

            <div className="panel p-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">
                EVENT SPECS
              </div>
              <div className="mt-4 divide-y divide-hairline">
                {[
                  ["DATE", dateLabel],
                  ["TIME", durationLabel],
                  ["STATUS", statusLabel],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5 font-mono text-[11px] uppercase tracking-[0.18em]">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-foreground">{v}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRegisterOpen(true)}
                className="btn-brutal btn-brutal-hover mt-6 w-full justify-center"
                data-cursor-hover
              >
                → REGISTER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Under-ticker */}
      <div className="bg-background">
        <Marquee
          size="lg"
          speed="normal"
          items={["REGISTER NOW", (featured?.title || "MINI MILITIA '26").toUpperCase(), dateLabel, "ENTER THE ARENA"]}
        />
      </div>

      <RegisterDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        eventTitle={featured?.title || "MINI MILITIA '26"}
        workshopId={workshopId}
        externalUrl={featured?.register_url || null}
      />
    </section>
  );
}

function RegisterDialog({
  open,
  onClose,
  eventTitle,
  workshopId,
  externalUrl,
}: {
  open: boolean;
  onClose: () => void;
  eventTitle: string;
  workshopId: string | null;
  externalUrl: string | null;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setDone(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.from("event_registrations").insert({
      workshop_id: workshopId,
      event_title: eventTitle,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      branch: branch.trim() || null,
      notes: notes.trim() || null,
      status: "pending",
    });
    setSubmitting(false);
    if (err) {
      setError(err.message || "Could not submit. Try again.");
      return;
    }
    setDone(true);
    setFullName(""); setEmail(""); setPhone(""); setBranch(""); setNotes("");
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg border border-foreground bg-background p-6 md:p-8 shadow-[8px_8px_0_0_var(--color-foreground)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 border border-hairline bg-background p-2 font-mono text-xs tap-target"
        >
          ✕
        </button>

        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">
          [ REGISTRATION ]
        </div>
        <h3 id="register-title" className="mt-2 font-display text-2xl leading-tight text-foreground md:text-3xl">
          {eventTitle}
        </h3>

        {done ? (
          <div className="mt-6 border border-signal bg-surface p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">
              [ SEAT LOCKED ]
            </div>
            <p className="mt-2 text-sm text-foreground">
              You're on the list for <strong>{eventTitle}</strong>. We'll email
              you the venue, time, and match schedule closer to the day.
            </p>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost mt-4 inline-flex"
              >
                → OPEN FULL FORM
              </a>
            )}
            <div className="mt-4">
              <button type="button" onClick={onClose} className="btn-brutal btn-brutal-hover">
                DONE
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              Full name
              <input
                required
                minLength={2}
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border border-hairline bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-foreground focus:border-signal focus:outline-none"
              />
            </label>
            <label className="grid gap-1.5 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-hairline bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-foreground focus:border-signal focus:outline-none"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                Phone
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border border-hairline bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-foreground focus:border-signal focus:outline-none"
                />
              </label>
              <label className="grid gap-1.5 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                Branch / Year
                <input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. CT · S3"
                  className="border border-hairline bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-foreground focus:border-signal focus:outline-none"
                />
              </label>
            </div>
            <label className="grid gap-1.5 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              Notes (optional)
              <textarea
                rows={3}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Squad name, dietary preference, anything else"
                className="border border-hairline bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-foreground focus:border-signal focus:outline-none"
              />
            </label>

            {error && (
              <div className="border border-destructive bg-surface p-3 font-mono text-[11px] uppercase tracking-[0.24em] text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-brutal btn-brutal-hover disabled:opacity-60"
              >
                {submitting ? "SUBMITTING…" : "→ LOCK MY SEAT"}
              </button>
              <button type="button" onClick={onClose} className="btn-ghost">
                CANCEL
              </button>
            </div>
            <p className="pt-1 text-[11px] text-muted-foreground">
              We store this on the ARCHERZ dashboard. Only team leads can see it.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}





function Team() {
  return (
    <section id="team" className="relative border-t border-hairline">
      <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-col gap-6 border-b border-hairline pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
              06 // THE PEOPLE
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

        <div className="mt-14 grid grid-cols-2 gap-0 border border-hairline lg:grid-cols-4">
          {TEAM.map((m, i) => (
            <div
              key={m.name}
              className="group relative flex flex-col justify-between p-6 md:p-8 border-t border-l border-hairline [&:nth-child(-n+2)]:border-t-0 lg:[&:nth-child(-n+4)]:border-t-0 [&:nth-child(odd)]:border-l-0 lg:[&:nth-child(4n+1)]:border-l-0 lg:[&:nth-child(odd)]:border-l"
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
          07 // TRAJECTORY
        </div>
        <h2 className="mt-6 max-w-3xl font-display text-5xl leading-[0.9] tracking-tight text-foreground md:text-7xl">
          Where this
          <br />
          <span className="italic font-serif font-normal text-muted-foreground">is going.</span>
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
          07 // ENLIST
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
          <Link to="/auth" className="btn-brutal btn-brutal-hover" data-cursor-hover>
            → JOIN ARCHERZ
          </Link>
          <a href="#contact" className="btn-ghost" data-cursor-hover>
            CONTACT US
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
            08 // TRANSMIT
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
              { label: "NAME", id: "contact-name", type: "text", placeholder: "Enter your name", max: 80 },
              { label: "EMAIL ADDRESS", id: "contact-email", type: "email", placeholder: "yourname@example.com", max: 120 },
            ].map((f) => (
              <div key={f.label} className="block">
                <label htmlFor={f.id} className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                  {f.label}
                </label>
                <input
                  id={f.id}
                  name={f.id}
                  type={f.type}
                  required
                  maxLength={f.max}
                  placeholder={f.placeholder}
                  aria-label={f.label}
                  className="mt-2 block w-full border-b border-hairline bg-transparent px-1 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none"
                />
              </div>
            ))}
            <div className="block">
              <label htmlFor="contact-message" className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                MESSAGE
              </label>
              <textarea
                id="contact-message"
                name="contact-message"
                required
                rows={5}
                maxLength={1000}
                placeholder="Enter your message"
                aria-label="Message"
                className="mt-2 block w-full resize-none border-b border-hairline bg-transparent px-1 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none"
              />
            </div>
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
                ["Admin", "/auth"],
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

