"use client";

import { useEffect, useRef } from "react";

/**
 * A small label that follows the mouse over what opens something larger (a project's picture):
 * the word from the element's data-cursor («Apri»), on a navy tag cut on the slope. Only with a
 * mouse; it eases after the pointer, or sits with it under reduced motion. For the eye only:
 * the links keep their own names.
 */
export function CursorLabel() {
  const tag = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = tag.current;
    if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    let on: HTMLElement | null = null;
    const place = () => (el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`);
    const tick = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      place();
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    // what is under the pointer: on move, and again after a scroll moves the page beneath it
    const update = (target: Element | null) => {
      const t = target?.closest<HTMLElement>("[data-cursor]") ?? null;
      if (t === on) return;
      on = t;
      if (t) {
        el.textContent = t.dataset.cursor ?? "";
        el.dataset.on = "";
      } else delete el.dataset.on;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!on || still) {
        x = tx;
        y = ty;
        place();
      } else if (!raf) raf = requestAnimationFrame(tick);
      update(e.target as Element);
    };
    const scrolled = () => update(document.elementFromPoint(tx, ty));
    const left = () => update(null);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", scrolled, { passive: true });
    document.documentElement.addEventListener("pointerleave", left);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", scrolled);
      document.documentElement.removeEventListener("pointerleave", left);
    };
  }, []);

  return <span ref={tag} className="vp-cursor t-small" aria-hidden="true" />;
}
