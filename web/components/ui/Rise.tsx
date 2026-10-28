import type { ReactNode } from "react";

/**
 * A page's title rising from its mask with CSS alone, from the first paint: the opening never
 * waits for the scripts (the titles further down keep their line-by-line entrance). Arriving
 * through the page transition, it waits until the plane has uncovered the page.
 */
export function Rise({ children }: { children: ReactNode }) {
  return (
    <span className="vp-rise-mask">
      <span className="vp-rise-in">{children}</span>
    </span>
  );
}
