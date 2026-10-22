"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks";

export type Figure = { value: number; decimals: number; pre: string; post: string; label: string; count: boolean };

/**
 * Four figures. Counts (sites, cities) run up once when they come into view; amounts and
 * ranks are set still, because a sum of money or a position should never be seen changing.
 * The server renders the final values (no JavaScript, reduced motion and search engines
 * see the real numbers).
 */
/** `paired`: two columns at every width, for when the figures share the row with the map. */
export function Counters({ figures, locale, paired = false }: { figures: Figure[]; locale: string; paired?: boolean }) {
  const root = useRef<HTMLDListElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-count]"));
    const fmt = (v: number, d: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return; // already on screen: keep the final values
    nodes.forEach((n) => (n.textContent = fmt(0, Number(n.dataset.decimals))));
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const t0 = performance.now();
        const D = 1600;
        const step = (now: number) => {
          const k = Math.min(1, (now - t0) / D);
          const e = 1 - Math.pow(1 - k, 3);
          nodes.forEach((n) => (n.textContent = fmt(Number(n.dataset.count) * e, Number(n.dataset.decimals))));
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      nodes.forEach((n) => (n.textContent = fmt(Number(n.dataset.count), Number(n.dataset.decimals))));
    };
  }, [reduced, locale]);

  const fmt = (v: number, d: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);

  return (
    <dl ref={root} className={`grid grid-cols-2 gap-x-[var(--col-gap)] gap-y-10 lg:gap-y-14 ${paired ? "" : "xl:grid-cols-4"}`}>
      {figures.map((f) => (
        <div key={f.label} className="flex min-w-0 flex-col border-t border-[var(--line)] pt-6">
          <dt className="t-small order-2 mt-3 max-w-[22ch] text-[var(--fg-2)]">{f.label}</dt>
          <dd className="vp-count t-num order-1 whitespace-nowrap">
            {f.pre}
            {f.count ? (
              <span data-count={f.value} data-decimals={f.decimals}>
                {fmt(f.value, f.decimals)}
              </span>
            ) : (
              fmt(f.value, f.decimals)
            )}
            {f.post}
          </dd>
        </div>
      ))}
    </dl>
  );
}
