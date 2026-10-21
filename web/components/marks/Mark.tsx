import type { CSSProperties } from "react";

/**
 * The primary stroke of the symbol, used as a unit mark.
 * Solid: a documented fact or a completed phase. Outline: a declared objective or a planned phase.
 */
export const MARK_VIEWBOX = "0 0 193.448 170";
export const MARK_POINTS = "0,0 93.793,0 193.448,170 99.655,170";
/** Top edge and horizontal run of the stroke, per unit of height. */
export const MARK_W = 93.793 / 170;
export const MARK_S = 99.655 / 170;

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
