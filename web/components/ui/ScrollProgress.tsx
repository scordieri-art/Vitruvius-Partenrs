"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/hooks";

/** A meeting of a point of the element with a line of the screen, written as ScrollTrigger does: "top 85%", "center 55%", "bottom top". */
const meeting = (s: string) => {
  const [el, vp] = s.split(" ");
  const at = (k: string) => ({ top: 0, center: 0.5, bottom: 1 })[k] ?? parseFloat(k) / 100;
  return { el: at(el), vp: at(vp) };
};

/**
 * Exposes how far an element has travelled between two meetings with the screen as a CSS variable
 * (--sp, 0 → 1) for scroll-linked styles: a slower photograph behind a title, the climb on the home
 * page. Measured natively, from the first frame the scope is drawn, so a style never starts from the
 * wrong end; the scroll is heard only while the element is near the screen. Unset (the styles' own
 * default) without scripts and with reduced motion.
 */
export function ScrollProgress({
  children,
  className = "",
  start = "top top",
  end = "bottom top",
}: {
  children: ReactNode;
  className?: string;
  start?: string;
  end?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = el.current;
    if (!node || reduced) return;
    const a = meeting(start);
    const b = meeting(end);
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = node.getBoundingClientRect();
      // how much farther the page must scroll for each meeting (negative once it has happened)
      const s = r.top + r.height * a.el - innerHeight * a.vp;
      const e = r.top + r.height * b.el - innerHeight * b.vp;
      const p = s === e ? (s <= 0 ? 1 : 0) : Math.min(1, Math.max(0, s / (s - e)));
      node.style.setProperty("--sp", p.toFixed(4));
    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) addEventListener("scroll", ask, { passive: true });
        else removeEventListener("scroll", ask);
        ask();
      },
      { rootMargin: "50% 0px" },
    );
    near.observe(node);
    addEventListener("resize", ask);
    return () => {
      near.disconnect();
      removeEventListener("scroll", ask);
      removeEventListener("resize", ask);
      cancelAnimationFrame(raf);
      node.style.removeProperty("--sp");
    };
  }, [reduced, start, end]);

  return (
    <div ref={el} className={className}>
      {children}
    </div>
  );
}
