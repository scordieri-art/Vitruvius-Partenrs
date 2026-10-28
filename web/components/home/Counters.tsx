"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks";

export type Figure = { value: number; decimals: number; pre: string; post: string; label: string; count: boolean };

/**
 * Four figures. Counts (sites, cities) run up once when they come into view; amounts and
 * ranks are set still, because a sum of money or a position should never be seen changing.
 * The text always holds the final value (no JavaScript, reduced motion, search engines and
 * screen readers get the real numbers): the count runs on a layer drawn over it from a data
 * attribute (.vp-count__n.is-counting::after), the real figure kept transparent underneath so
 * nothing moves when the layer goes.
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
    const draw = (n: HTMLElement, v: number) => (n.dataset.n = fmt(v, Number(n.dataset.decimals)));
    const done = (n: HTMLElement) => {
      n.classList.remove("is-counting");
      delete n.dataset.n;
    };
    nodes.forEach((n) => {
      draw(n, 0);
      n.classList.add("is-counting");
    });
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
          nodes.forEach((n) => draw(n, Number(n.dataset.count) * e));
          if (k < 1) raf = requestAnimationFrame(step);
          else nodes.forEach(done);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      nodes.forEach(done);
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
              <span className="vp-count__n" data-count={f.value} data-decimals={f.decimals}>
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
