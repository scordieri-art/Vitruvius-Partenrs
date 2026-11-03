import type { CSSProperties } from "react";
import { Mark } from "@/components/marks/Mark";
import { PressLive } from "./PressLive";

export type Clipping = { outlet: string; url: string; title?: string; iso: string; date: string; project: string };

/**
 * Home, «Ne hanno scritto»: the outlets that covered the group's operations, set large in one
 * line like mastheads, and the headline of the one chosen beneath them, with its operation, date
 * and the way to the article. The mastheads are a group of radio buttons, as «In numeri»: they
 * work without scripts (click, tap, arrow keys) and read as a choice; with a mouse, resting on a
 * name chooses it too (PressLive). The chosen name fills its mark and draws its rule; its headline
 * rises line by line while the previous one fades. The newest first.
 */
export function Press({ items, legend, name, read, opens }: { items: Clipping[]; legend: string; name: string; read: string; opens: string }) {
  return (
    <PressLive className="vp-rs">
      <style>{picked(items.map((_, i) => String(i)))}</style>
      <fieldset className="vp-rs__heads">
        <legend className="sr-only">{legend}</legend>
        {items.map((x, i) => (
          <label key={x.outlet} className="vp-rs__head" style={{ "--r": i } as CSSProperties}>
            <input type="radio" name={name} value={String(i)} defaultChecked={i === 0} className="sr-only" data-pick={String(i)} />
            <Mark kind="outline" className="vp-rs__mark" />
            <span className="vp-rs__name">{x.outlet}</span>
          </label>
        ))}
      </fieldset>
      <div className="vp-rs__stage" aria-live="polite">
        {items.map((x, i) => (
          <article key={x.outlet} className="vp-rs__panel" data-k={String(i)}>
            {/* the headline as published (the operation's name where there is none) */}
            <p className="vp-rs__quote" lang="it">
              {x.title ? `«${x.title}»` : x.project}
            </p>
            <div className="vp-rs__aside">
              <p className="vp-rs__meta t-label">
                <span className="text-[var(--fg)]">{x.outlet}</span> · {x.project} · {x.iso ? <time dateTime={x.iso}>{x.date}</time> : x.date}
              </p>
              <a href={x.url} target="_blank" rel="noopener noreferrer" className="vp-rs__read vp-ulink t-small">
                {read} <span aria-hidden="true">↗</span>
                <span className="sr-only">
                  {" "}
                  ({x.outlet}, {opens})
                </span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </PressLive>
  );
}

/** The chosen headline shows: one rule per outlet, since its radio and its panel are far apart in the page. */
const picked = (keys: string[]) =>
  keys
    .map((k) => {
      const on = `.vp-rs:has([data-pick="${k}"]:checked) .vp-rs__panel[data-k="${k}"]`;
      return `${on}{opacity:1;visibility:visible;transition:opacity .45s var(--ease-enter) .12s,visibility 0s}@media (prefers-reduced-motion:no-preference){html.js-motion .vp-rs[data-seen]:has([data-pick="${k}"]:checked) .vp-rs__panel[data-k="${k}"] .vp-rs__quote{animation:vp-rs-rise .8s var(--ease-enter) .1s both}}`;
    })
    .join("");
