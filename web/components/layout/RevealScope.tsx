"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { SplitText as SplitTextT } from "gsap/SplitText";
import { EASE, loadMotion, motionNow, prefersReducedMotion, whenMotion } from "@/lib/motion";

const SLOPE = 99.655 / 170;
// where a page opens: the first two blocks of a scope (or of the article that holds the whole
// page), whose entrances play in CSS (globals.css)
const EARLY = ":is(.vp-scope > :nth-child(-n + 2):not(article), .vp-scope > article > :nth-child(-n + 2)) [data-reveal]";

// SplitText, once loaded: the titles that rise line by line need it, nothing else does
let splitter: typeof SplitTextT | null = null;
let splitting: Promise<void> | null = null;
const loadSplit = () =>
  (splitting ??= Promise.all([loadMotion(), import("gsap/SplitText")]).then(([{ gsap }, { SplitText }]) => {
    gsap.registerPlugin(SplitText);
    splitter = SplitText;
  }));

/**
 * Entrance animations, declared in markup:
 *  data-reveal="lines"  — text rises line by line from a mask
 *  data-reveal="fade"   — soft rise + fade
 *  data-reveal="image"  — the frame opens with the slope of the symbol, the image settles
 *  data-reveal="rule"   — hairline draws from the left
 *  data-reveal="fill"   — solid marks inside fill in sequence (outline → solid)
 * Optional data-reveal-delay (seconds).
 *
 * Where a page opens (the first two blocks of the scope) the entrances play in CSS from the first
 * frame the browser draws (globals.css): nothing there waits for the scripts. The rest waits
 * transparent; when the scripts run, this scope plays it as it comes into view, as CSS transitions
 * with the two brand easings (and takes back an opening entrance that turns out to be below the
 * screen, out of sight, so nothing jumps). The titles rise line by line with GSAP's SplitText,
 * loaded at the reader's first movement (lib/motion); one that plays before it is there rises
 * whole, never waiting for it. The scope's effect runs only after its own subtree has hydrated,
 * so SplitText never rewrites markup that React has not claimed yet.
 */
export function RevealScope({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope || prefersReducedMotion()) return;
    const els = Array.from(scope.querySelectorAll<HTMLElement>("[data-reveal]"));
    const splits: SplitTextT[] = [];
    const timers: number[] = [];
    let live = true;
    const html = document.documentElement;
    // where everything is, read in one go before any style is written: one layout, not one per
    // element (with room for the rise its CSS entrance may still be playing). Arriving through the
    // page transition, the page is put back at its top only once it is drawn: measured from there
    const offset = html.dataset.vpTransition && !location.hash ? window.scrollY : 0;
    const inView = new Map(els.map((el) => [el, el.getBoundingClientRect().top + offset - 32 < window.innerHeight]));
    // the rest plays as it comes in: one native observer for the page, not a scroll trigger per
    // element (it never measures the layout); "top 88%" = 12% above the bottom of the screen
    const pending = new Map<Element, () => void>();
    const observers = new Map<string, IntersectionObserver>();
    const observe = (el: HTMLElement, start: string, play: () => void) => {
      const pct = Number(/top (\d+)%/.exec(start)?.[1] ?? 88);
      const margin = `0px 0px -${100 - pct}% 0px`;
      let io = observers.get(margin);
      if (!io) {
        io = new IntersectionObserver(
          (entries, obs) =>
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              obs.unobserve(e.target);
              pending.get(e.target)?.();
              pending.delete(e.target);
            }),
          { rootMargin: margin },
        );
        observers.set(margin, io);
      }
      pending.set(el, play);
      io.observe(el);
    };
    const later = (s: number, fn: () => void) => timers.push(window.setTimeout(fn, s * 1000));
    // a CSS transition written on the element for its entrance ([property, seconds, easing] each,
    // after `delay`), removed once its longest part has played: by the clock, as an end event
    // would come from the shortest part first
    type Part = [string, number, string];
    const run = (el: HTMLElement, parts: Part[], delay: number, to: Partial<CSSStyleDeclaration>, done?: () => void) => {
      el.style.transition = parts.map(([p, d, e]) => `${p} ${d}s ${e} ${delay}s`).join(", ");
      // the start state is painted before the change, so the transition runs
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          Object.assign(el.style, to);
          later(delay + Math.max(...parts.map((x) => x[1])) + 0.1, () => {
            el.style.transition = "";
            done?.();
          });
        }),
      );
    };
    // out of its CSS entrance for good (removing this would replay it)
    const still = (el: HTMLElement) => (el.style.animation = "none");

    els.forEach((el) => {
      const kind = el.dataset.reveal;
      const delay = Number(el.dataset.revealDelay ?? 0);
      const start = el.dataset.revealStart ?? "top 88%";
      const inner = kind === "image" ? Array.from(el.querySelectorAll<HTMLElement>("img, video, canvas")) : [];
      const shown = inView.get(el);
      // on screen: now, or once the page transition's plane has gone (and a shared picture has
      // dissolved); below it: as it comes in
      const go = (play: () => void) => {
        if (!shown) observe(el, start, play);
        else if (html.dataset.vpTransition) later(html.dataset.vpMorph ? 1.05 : 0.5, play);
        else play();
      };

      if (kind === "fill") {
        // marks inside turn from outline to solid, in their --d order (CSS transitions)
        go(() => later(delay, () => el.setAttribute("data-filled", "")));
        return;
      }
      // a picture that has just grown into this frame (shared-image transition): shown as it is
      const grown = kind === "image" && shown && html.dataset.vpMorph;
      if (el.matches(EARLY)) {
        // where the page opens its entrance plays in CSS, from the first frame (globals.css);
        // below the screen after all, it is taken back
        if (grown || !shown) [el, ...inner].forEach(still);
        if (shown) return;
      } else if (grown) {
        el.style.opacity = "1";
        return;
      }

      if (kind === "lines") {
        el.style.opacity = "0";
        go(() => {
          if (!live) return;
          const gsap = motionNow()?.gsap;
          if (!gsap || !splitter) {
            // the engine is not there yet: the whole title rises, in CSS
            Object.assign(el.style, { opacity: "0.01", translate: "0 1.2rem" });
            run(el, [["opacity", 0.9, EASE.enter], ["translate", 1.05, EASE.enter]], delay, { opacity: "1", translate: "0 0" }, () => (el.style.translate = ""));
            return;
          }
          // split only when the heading plays: splitting every heading on load forces a layout
          // per heading. .vp-keep: a run of words that must stay on one line (DashTitle) is left whole
          const split = splitter.create(el, { type: "lines", mask: "lines", linesClass: "vp-line", aria: "none", ignore: ".vp-keep" });
          splits.push(split);
          // 150%: fully below the mask, padding included (see .vp-line-mask)
          gsap.set(split.lines, { yPercent: 150 });
          el.style.opacity = "1";
          gsap.to(split.lines, { yPercent: 0, duration: 1.05, ease: "enter", stagger: 0.09, delay });
        });
      } else if (kind === "image") {
        // closed until it plays: its proportions are read then, not on load
        Object.assign(el.style, { opacity: "1", clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" });
        inner.forEach((i) => (i.style.scale = "1.08"));
        go(() => {
          // the leading edge runs on the slope, from wholly left of the frame to wholly right
          const s = (((el.clientHeight || 1) * SLOPE) / (el.clientWidth || 1)) * 100;
          el.style.clipPath = `polygon(0 0, ${-s}% 0, 0% 100%, 0 100%)`;
          run(el, [["clip-path", 1.2, EASE.move]], delay, { clipPath: `polygon(0 0, 100% 0, ${100 + s}% 100%, 0 100%)` }, () => (el.style.clipPath = ""));
          inner.forEach((i) => run(i, [["scale", 1.6, EASE.enter]], delay, { scale: "1" }, () => (i.style.scale = "")));
        });
      } else if (kind === "rule") {
        Object.assign(el.style, { opacity: "1", scale: "0 1", transformOrigin: "left center" });
        go(() => run(el, [["scale", 1.1, EASE.move]], delay, { scale: "1 1" }, () => (el.style.scale = "")));
      } else {
        Object.assign(el.style, { opacity: "0", translate: "0 24px" });
        go(() => run(el, [["opacity", 0.8, EASE.enter], ["translate", 0.8, EASE.enter]], delay, { opacity: "1", translate: "0 0" }, () => (el.style.translate = "")));
      }
    });

    // the titles below the screen rise line by line: SplitText comes with the engine
    const cancelSplit = els.some((el) => el.dataset.reveal === "lines" && !inView.get(el)) ? whenMotion(() => void loadSplit()) : () => {};

    // the scrubbed effects (parallax, map tilt…) re-measure once fonts and pictures have settled,
    // when the main thread has a moment rather than in the middle of the page's start
    const idle = (fn: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
    const refresh = () => idle(() => motionNow()?.ScrollTrigger.refresh());
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      live = false;
      cancelSplit();
      observers.forEach((io) => io.disconnect());
      timers.forEach(clearTimeout);
      splits.forEach((s) => s.revert());
      window.removeEventListener("load", refresh);
    };
  }, []);

  return (
    <div ref={root} className="vp-scope contents">
      {children}
    </div>
  );
}
