"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, ScrollTrigger, prefersReducedMotion, setupGsap } from "@/lib/motion";

const SLOPE = 99.655 / 170;

/**
 * Entrance animations, declared in markup:
 *  data-reveal="lines"  — text rises line by line from a mask
 *  data-reveal="fade"   — soft rise + fade
 *  data-reveal="image"  — the frame opens with the slope of the symbol, the image settles
 *  data-reveal="rule"   — hairline draws from the left
 *  data-reveal="fill"   — solid marks inside fill in sequence (outline → solid)
 * Optional data-reveal-delay (seconds).
 *
 * Each page wraps its content in a RevealScope. The scope's effect runs only
 * after its own subtree has hydrated, so SplitText never rewrites markup that
 * React has not claimed yet (which would force a client re-render).
 */
export function RevealScope({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    setupGsap();
    gsap.registerPlugin(SplitText);
    const els = Array.from(scope.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (prefersReducedMotion()) {
      els.forEach((el) => (el.style.opacity = "1"));
      return;
    }
    const splits: SplitText[] = [];
    // where everything is, read in one go before any style is written: one layout, not one per element
    const inView = new Map(els.map((el) => [el, el.getBoundingClientRect().top < window.innerHeight]));
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
    // already visible when the page opens: play now, never wait for a scroll
    const when = (el: HTMLElement, start: string, play: () => void) => {
      if (inView.get(el)) {
        // during a page transition, start as the plane uncovers the page
        // (after a shared-image transition, once the picture has dissolved into the page)
        if (document.documentElement.dataset.vpTransition) gsap.delayedCall(document.documentElement.dataset.vpMorph ? 1.05 : 0.5, play);
        else play();
        return;
      }
      observe(el, start, play);
    };

    els.forEach((el) => {
      const kind = el.dataset.reveal;
      const delay = Number(el.dataset.revealDelay ?? 0);
      const start = el.dataset.revealStart ?? "top 88%";

      if (kind === "lines") {
        // split only when the heading is about to play: splitting every heading on load
        // forces a layout per heading while the page is still busy hydrating
        when(el, start, () => {
          // .vp-keep: a run of words that must stay on one line (DashTitle) is left whole
          const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "vp-line", aria: "none", ignore: ".vp-keep" });
          splits.push(split);
          // 150%: fully below the mask, padding included (see .vp-line-mask)
          gsap.set(split.lines, { yPercent: 150 });
          gsap.set(el, { opacity: 1 });
          gsap.to(split.lines, { yPercent: 0, duration: 1.05, ease: "enter", stagger: 0.09, delay });
        });
        return;
      }
      gsap.set(el, { opacity: 1 });

      if (kind === "image") {
        const inner = el.querySelector<HTMLElement>("img, video, canvas");
        // the picture has just grown into this frame: show it as it is
        if (document.documentElement.dataset.vpMorph && inView.get(el)) return;
        const st = { p: 0 };
        // the frame's proportions are read when it plays, not on load: closed until then
        let s = 0;
        const set = () => {
          const r = st.p * (100 + s) - s;
          el.style.clipPath = `polygon(0 0, ${r}% 0, ${r + s}% 100%, 0 100%)`;
        };
        el.style.clipPath = "polygon(0 0, 0 0, 0 100%, 0 100%)";
        if (inner) gsap.set(inner, { scale: 1.08 });
        when(el, start, () => {
          s = ((el.clientHeight || 1) * SLOPE) / (el.clientWidth || 1) * 100;
          set();
          gsap.to(st, { p: 1, duration: 1.2, ease: "move", delay, onUpdate: set, onComplete: () => (el.style.clipPath = "") });
          if (inner) gsap.to(inner, { scale: 1, duration: 1.6, ease: "enter", delay });
        });
      } else if (kind === "fill") {
        // marks inside turn from outline to solid, in their --d order (CSS transitions)
        when(el, start, () => gsap.delayedCall(delay, () => el.setAttribute("data-filled", "")));
      } else if (kind === "rule") {
        gsap.set(el, { scaleX: 0, transformOrigin: "left center" });
        when(el, start, () => gsap.to(el, { scaleX: 1, duration: 1.1, ease: "move", delay }));
      } else {
        gsap.set(el, { opacity: 0, y: 24 });
        when(el, start, () => gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: "enter", delay }));
      }
    });

    // the scrubbed effects (parallax, map tilt…) re-measure once fonts and pictures have settled,
    // when the main thread has a moment rather than in the middle of the page's start
    const idle = (fn: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
    const refresh = () => idle(() => ScrollTrigger.refresh());
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      observers.forEach((io) => io.disconnect());
      splits.forEach((s) => s.revert());
      window.removeEventListener("load", refresh);
    };
  }, []);

  return (
    <div ref={root} className="contents">
      {children}
    </div>
  );
}
