"use client";

import { Children, useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * The operations as a stack of dossiers. Each one sticks a little lower than the one before
 * (the top of every dossier stays in view, like the tabs of folders in a drawer) and the next
 * slides up over it; the one being covered steps back (--cover, 0 → 1: a little smaller, a little
 * darker). The dossiers themselves are rendered by the page; this only measures the overlap.
 * With reduced motion they simply follow one another.
 */
export function OperationStack({ label, children }: { label: string; children: ReactNode }) {
  const list = useRef<HTMLOListElement>(null);
  const n = Children.count(children);

  useEffect(() => {
    const el = list.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = [...el.children] as HTMLElement[];
    let raf = 0;
    const update = () => {
      raf = 0;
      items.forEach((item, i) => {
        const next = items[i + 1];
        if (!next) return;
        const a = item.getBoundingClientRect();
        const b = next.getBoundingClientRect();
        // how far the next dossier has climbed over this one
        const cover = Math.min(Math.max((a.bottom - b.top) / a.height, 0), 1);
        item.style.setProperty("--cover", cover.toFixed(3));
      });
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
  }, []);

  return (
    <ol ref={list} className="vp-ops container-x" aria-label={label} style={{ "--n": n } as CSSProperties}>
      {Children.map(children, (child, i) => (
        <li className="vp-ops__item" style={{ "--i": i } as CSSProperties}>
          {child}
        </li>
      ))}
    </ol>
  );
}
