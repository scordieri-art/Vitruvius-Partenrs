import type { CSSProperties } from "react";
import { SYMBOL_POLYGONS, SYMBOL_VIEWBOX } from "@/components/brand/logo-paths";

/**
 * The primary stroke of the symbol, used as a unit mark.
 * Solid: a documented fact or a completed phase. Outline: a declared objective or a planned phase.
 */
export const MARK_VIEWBOX = "0 0 193.448 170";
export const MARK_POINTS = "0,0 93.793,0 193.448,170 99.655,170";
/** Top edge and horizontal run of the stroke, per unit of height. */
export const MARK_W = 93.793 / 170;
export const MARK_S = 99.655 / 170;
/** How far the stroke's slope runs across a frame w × h, as a share of its width: --sl, for data-reveal="image". */
export const slopeRun = (w: number, h: number) => `${((h / w) * MARK_S * 100).toFixed(1)}%`;

export function Mark({
  kind = "solid",
  className = "",
  order,
}: {
  kind?: "solid" | "outline";
  className?: string;
  /** position in a fill sequence (see data-reveal="fill") */
  order?: number;
}) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      className={`vp-mark vp-mark--${kind} ${className}`}
      style={order !== undefined ? ({ "--d": order } as CSSProperties) : undefined}
    >
      <polygon points={MARK_POINTS} />
    </svg>
  );
}

const points = (pts: [number, number][]) => pts.map(([x, y]) => `${x},${y}`).join(" ");

/**
 * The whole symbol, both masses, solid. In a fill sequence (data-reveal="fill") it is first drawn
 * in outline and fills, the secondary mass after the primary.
 */
export function SymbolMark({ className = "", secondary }: { className?: string; secondary?: string }) {
  return (
    <svg viewBox={SYMBOL_VIEWBOX} aria-hidden="true" focusable="false" className={`vp-mark vp-mark--solid ${className}`}>
      <polygon points={points(SYMBOL_POLYGONS.primary)} style={{ "--d": 0 } as CSSProperties} />
      <polygon points={points(SYMBOL_POLYGONS.secondary)} className={secondary} style={{ "--d": 2 } as CSSProperties} />
    </svg>
  );
}

/** Path data for `count` marks laid out row by row. */
export function markRows(
  count: number,
  cols: number,
  { h, px, py, y0 = 0 }: { h: number; px: number; py: number; y0?: number },
): string {
  const w = h * MARK_W;
  const s = h * MARK_S;
  const f = (n: number) => +n.toFixed(2);
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = (i % cols) * px;
    const y = y0 + Math.floor(i / cols) * py;
    d += `M${f(x)} ${f(y)}h${f(w)}l${f(s)} ${h}h${f(-w)}z`;
  }
  return d;
}
