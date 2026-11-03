"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * What «Ne hanno scritto» (Press) adds with scripts: the entrance, played when the section comes
 * into view (data-seen: the mastheads rise one after another, the first headline with them), and,
 * with a mouse, a masthead chosen when the pointer rests on it (a short wait, so crossing the row on
 * the way elsewhere chooses nothing). Everything else is the radio group and CSS.
 */
export function PressLive({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const seen = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        seen.disconnect();
        el.setAttribute("data-seen", "");
      },
      { threshold: 0.3 },
    );
    seen.observe(el);

    let wait = 0;
    const heads = matchMedia("(hover: hover) and (pointer: fine)").matches ? Array.from(el.querySelectorAll<HTMLLabelElement>(".vp-rs__head")) : [];
    const enter = (e: PointerEvent) => {
      const input = (e.currentTarget as HTMLElement).querySelector("input");
      clearTimeout(wait);
      wait = window.setTimeout(() => {
        if (input && !input.checked) input.checked = true;
      }, 120);
    };
    const leave = () => clearTimeout(wait);
    heads.forEach((h) => {
      h.addEventListener("pointerenter", enter);
      h.addEventListener("pointerleave", leave);
    });
    return () => {
      seen.disconnect();
      clearTimeout(wait);
      heads.forEach((h) => {
        h.removeEventListener("pointerenter", enter);
        h.removeEventListener("pointerleave", leave);
      });
    };
  }, []);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
