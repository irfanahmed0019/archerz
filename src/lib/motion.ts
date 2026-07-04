// Motion primitives inspired by noartmusic.com:
// - Lenis smooth scroll
// - Custom "cursor bubble" that follows the pointer over [data-cursor-hover]
// - Scramble text on [data-scramble] (reveal on view; re-run on hover if [data-scramble="hover"])
// - Mask line reveal on [data-reveal="mask"] (translateY(102%) -> 0)
// Signature easings from the reference:
//   OUT_EXPO_LIKE = cubic-bezier(0.16, 1, 0.3, 1)
//   IN_OUT_HARD   = cubic-bezier(0.625, 0.05, 0, 1)

import Lenis from "lenis";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/*<>[]{}=+-";

let started = false;

export function startMotion() {
  if (started || typeof window === "undefined") return;
  started = true;

  // --- Lenis smooth scroll -------------------------------------------------
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // --- Cursor bubble -------------------------------------------------------
  const bubble = document.createElement("div");
  bubble.setAttribute("data-cursor-bubble", "");
  bubble.className =
    "pointer-events-none fixed left-0 top-0 z-[9999] hidden md:flex items-center justify-center " +
    "h-24 w-24 rounded-full bg-signal text-signal-foreground font-mono text-[10px] uppercase " +
    "tracking-[0.2em] opacity-0 scale-0 will-change-transform";
  bubble.style.transition =
    "opacity .25s cubic-bezier(0.16,1,0.3,1), transform .25s cubic-bezier(0.16,1,0.3,1)";
  bubble.textContent = "";
  document.body.appendChild(bubble);

  let mx = 0,
    my = 0,
    bx = 0,
    by = 0;
  const move = (e: MouseEvent) => {
    mx = e.clientX;
    my = e.clientY;
  };
  window.addEventListener("mousemove", move, { passive: true });

  const tick = () => {
    bx += (mx - bx) * 0.18;
    by += (my - by) * 0.18;
    bubble.style.transform = `translate3d(${bx - 48}px, ${by - 48}px, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const onOver = (e: Event) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor-hover]");
    if (!t) return;
    const label = t.dataset.cursorText || "VIEW";
    bubble.textContent = label;
    bubble.style.opacity = "1";
    bubble.style.transform += " scale(1)";
    bubble.classList.remove("scale-0");
  };
  const onOut = (e: Event) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor-hover]");
    if (!t) return;
    bubble.style.opacity = "0";
    bubble.classList.add("scale-0");
  };
  document.addEventListener("mouseover", onOver);
  document.addEventListener("mouseout", onOut);

  // --- Scramble text -------------------------------------------------------
  const scramble = (el: HTMLElement, duration = 900) => {
    const original = el.dataset.scrambleOriginal ?? el.textContent ?? "";
    el.dataset.scrambleOriginal = original;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const reveal = Math.floor(original.length * p);
      let out = "";
      for (let i = 0; i < original.length; i++) {
        const ch = original[i];
        if (i < reveal || ch === " " || ch === "\n") out += ch;
        else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = original;
    };
    requestAnimationFrame(step);
  };

  const scrambleIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          scramble(e.target as HTMLElement, 1100);
          scrambleIO.unobserve(e.target);
        }
      }
    },
    { threshold: 0.5 },
  );
  document.querySelectorAll<HTMLElement>("[data-scramble]").forEach((el) => {
    if (el.dataset.scramble === "hover") {
      el.addEventListener("mouseenter", () => scramble(el, 500));
    } else {
      scrambleIO.observe(el);
    }
  });

  // --- Mask line reveal ----------------------------------------------------
  // Wrap children in an overflow-hidden line, then slide them up.
  const maskIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).dataset.revealed = "true";
          maskIO.unobserve(e.target);
        }
      }
    },
    { threshold: 0.25 },
  );
  document.querySelectorAll<HTMLElement>("[data-reveal='mask']").forEach((el, i) => {
    el.style.setProperty("--reveal-delay", `${Math.min(i, 6) * 60}ms`);
    maskIO.observe(el);
  });
}
