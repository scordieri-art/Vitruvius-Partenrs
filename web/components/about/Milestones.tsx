import type { CSSProperties } from "react";
import { TLink } from "@/components/layout/PageTransition";
import { Mark } from "@/components/marks/Mark";

type Item = { year: string; tag: string; text: string; link?: { href: string; label: string } };

/**
 * Six years as a staircase: one step a year, rising left to right, drawn by a single navy
 * line as the section comes into view, with the brand stroke standing on each tread and
 * filling in turn. Under each tread: the year, what kind of step it was, what happened and
 * the page that proves it. On phones the stair stands up into a rail down the page.
 * All seven steps are in view at once: nothing to drag.
 */
export function Milestones({ items, label }: { items: Item[]; label: string }) {
  return (
    <ol className="vp-stair" data-reveal="fill" aria-label={label} style={{ "--n": items.length } as CSSProperties}>
      {items.map((m, i) => (
        <li key={m.year} className="vp-stair__step" style={{ "--i": i } as CSSProperties}>
          <span className="vp-stair__tread" aria-hidden="true">
            <Mark order={i} className="vp-stair__mark" />
          </span>
          <p className="vp-stair__year t-num">{m.year}</p>
          <p className="t-label mt-1">{m.tag}</p>
          <p className="vp-stair__text mt-4">{m.text}</p>
          {m.link ? (
            <TLink href={m.link.href} className="vp-ulink t-small mt-4 inline-block">
              {m.link.label} →
            </TLink>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
