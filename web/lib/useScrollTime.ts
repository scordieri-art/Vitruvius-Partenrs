"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll as time, for a section that holds still (a sticky stage) while the page scrolls past
 * it. The wrapper's run is shared equally among n steps; the stage gets --t, from 0 (first
 * step) to n - 1, continuous, resting at both ends; `active` is the step nearest to it.
 * `go(i)` scrolls to where step i sits in the middle of its share (through Lenis when it is
 * running; at once with reduced motion). Used by Chronicle (Chi siamo) and Filiera (home).
 */
export function useScrollTime<W extends HTMLElement = HTMLDivElement, S extends HTMLElement = HTMLDivElement>(n: number) {
  const [active, setActive] = useState(0);
  const wrap = useRef<W>(null);
  const stage = useRef<S>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const run = r.height - window.innerHeight;
      const p = run > 0 ? Math.min(Math.max(-r.top / run, 0), 1) : 0;
      const t = Math.min(Math.max(p * n - 0.5, 0), n - 1);
      stage.current?.style.setProperty("--t", t.toFixed(3));
      setActive(Math.round(t));
    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", ask);
    return () => {
      removeEventListener("scroll", ask);
      removeEventListener("resize", ask);
      cancelAnimationFrame(raf);
    };
  }, [n]);

  const go = (i: number) => {
    const el = wrap.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const y = top + ((i + 0.5) / n) * (el.offsetHeight - window.innerHeight);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o?: { immediate?: boolean }) => void } }).__lenis;
    if (lenis) lenis.scrollTo(y, { immediate: reduce });
    else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  };

  return { wrap, stage, active, go };
}
