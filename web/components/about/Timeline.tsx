"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Mark } from "@/components/marks/Mark";

/** Milestones as a row you drag (mouse), swipe (touch) or move with the arrow buttons. */
export function Timeline({ items, prev, next, hint }: { items: { year: string; text: string }[]; prev: string; next: string; hint: string }) {
  const row = useRef<HTMLOListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const bar = useRef<HTMLSpanElement>(null);
  const progress = () => {
    const el = row.current;
    if (!el || !bar.current) return;
    // the bar shows how much of the row has been seen so far
    bar.current.style.setProperty("--tp", Math.min(1, (el.scrollLeft + el.clientWidth) / el.scrollWidth).toFixed(4));
  };

  useEffect(() => {
    progress();
    window.addEventListener("resize", progress);
    return () => window.removeEventListener("resize", progress);
  });

  const by = (dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const item = el.querySelector<HTMLElement>("li");
    const step = item ? item.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0") : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const down = (e: PointerEvent<HTMLOListElement>) => {
    if (e.pointerType !== "mouse" || !row.current) return;
    drag.current = { x: e.clientX, left: row.current.scrollLeft, moved: false };
    setGrabbing(true);
  };
  const move = (e: PointerEvent<HTMLOListElement>) => {
    const d = drag.current;
    if (!d || !row.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 3) d.moved = true;
    row.current.scrollLeft = d.left - dx;
  };
  const up = () => {
    drag.current = null;
    setGrabbing(false);
  };

  return (
    <div>
      <ol
        ref={row}
        className={`vp-timeline relative ${grabbing ? "is-grabbing" : ""}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onScroll={progress}
        tabIndex={0}
        aria-label={hint}
      >
        {items.map((m, i) => (
          <li key={m.year} className="vp-timeline__item">
            <p className="flex items-center gap-3">
              <Mark className="h-[1.1rem]" />
              <span aria-hidden="true" className="h-px flex-1 bg-[var(--line)]" />
            </p>
            <p className="t-xl t-num mt-6">{m.year}</p>
            <p className="t-body-l mt-4 max-w-[22ch]">{m.text}</p>
            <span className="sr-only">
              {i + 1} / {items.length}
            </span>
          </li>
        ))}
      </ol>
      <span aria-hidden="true" className="mt-8 block h-px w-full bg-[var(--line)]">
        <span ref={bar} className="vp-timeline__bar block h-px w-full bg-[var(--fg)]" style={{ "--tp": 0.12 } as CSSProperties} />
      </span>
      <div className="mt-6 flex items-center justify-between">
        <p className="t-label">{hint} →</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => by(-1)} className="vp-iconbtn" aria-label={prev}>
            ←
          </button>
          <button type="button" onClick={() => by(1)} className="vp-iconbtn" aria-label={next}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}
