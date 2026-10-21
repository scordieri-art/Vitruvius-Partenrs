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
      els.forEach((el) => (el.style.visibility = "visible"));
      return;
    }
    const triggers: ScrollTrigger[] = [];
    const splits: SplitText[] = [];
    // already visible when the page opens: play now, never wait for a scroll
    const when = (el: HTMLElement, start: string, play: () => void) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        // during a page transition, start as the plane uncovers the page
        if (document.documentElement.dataset.vpTransition) gsap.delayedCall(0.5, play);
        else play();
        return;
      }
      triggers.push(ScrollTrigger.create({ trigger: el, start, once: true, onEnter: play }));
    };

    els.forEach((el) => {
      const kind = el.dataset.reveal;
      const delay = Number(el.dataset.revealDelay ?? 0);
      const start = el.dataset.revealStart ?? "top 88%";
      gsap.set(el, { visibility: "visible" });

      if (kind === "lines") {
        const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "vp-line", aria: "none" });
        splits.push(split);
        // 150%: fully below the mask, padding included (see .vp-line-mask)
        gsap.set(split.lines, { yPercent: 150 });
        when(el, start, () => gsap.to(split.lines, { yPercent: 0, duration: 1.05, ease: "enter", stagger: 0.09, delay }));
      } else if (kind === "image") {
        const inner = el.querySelector<HTMLElement>("img, video, canvas");
        const st = { p: 0 };
        const set = () => {
          const w = el.clientWidth || 1;
          const h = el.clientHeight || 1;
          const s = (h * SLOPE) / w * 100;
          const r = st.p * (100 + s) - s;
          el.style.clipPath = `polygon(0 0, ${r}% 0, ${r + s}% 100%, 0 100%)`;
        };
        set();
        if (inner) gsap.set(inner, { scale: 1.08 });
        when(el, start, () => {
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

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      triggers.forEach((t) => t.kill());
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
