import type { CSSProperties, ReactNode } from "react";
import { Mark } from "@/components/marks/Mark";
import { FiguresLive } from "./FiguresLive";

export type Figure = {
  key: string;
  /** as printed, digit by digit: "300+", "73,8", "83°" */
  value: string;
  /** set small after the value: "M€"; `sup` raises it, as an English ordinal ("rd") */
  unit?: { text: string; sup?: boolean };
  /** how the figure is read aloud, where the printed one reads badly ("83°" as degrees) */
  spoken?: string;
  /** its name in the index */
  row: string;
  /** what it counts, under the large figure */
  label: string;
  note?: ReactNode;
  source?: ReactNode;
  /** a declared objective or a planned phase: the mark in outline */
  planned?: boolean;
};

/**
 * Home, «In numeri»: one figure at a time. Beside it, the index of the published figures, each
 * with its value, so all of them read at a glance; the row chosen sets its figure large, with what
 * it counts, its context and its source. The index is a group of radio buttons: it works without
 * scripts (click, tap, arrow keys) and is read as a choice; with a mouse, resting on a row chooses
 * it too, and the section plays its entrance when it comes into view (FiguresLive). The digits
 * roll like a counter, the figure going up through its edge and the chosen one following from
 * under it; the chosen row fills with the navy block cut on the slope, the primary button's shape.
 */
export function Figures({ figures, legend, name }: { figures: Figure[]; legend: string; name: string }) {
  return (
    <FiguresLive className="vp-cifre">
      <style>{picked(figures.map((f) => f.key))}</style>
      <div className="vp-cifre__stage" aria-live="polite">
        {figures.map((f) => (
          <div key={f.key} className="vp-cifre__panel" data-k={f.key}>
            <p className="vp-cifre__n t-num">
              <span className="vp-cifre__mask" aria-hidden="true">
                {[...f.value].map((ch, i) => (
                  <span key={i} className="vp-cifre__ch" style={{ "--i": i } as CSSProperties}>
                    {ch}
                  </span>
                ))}
                {/* the unit in a box of the digits' size, so it travels as far as they do */}
                {f.unit ? (
                  <span className="vp-cifre__ch" style={{ "--i": f.value.length } as CSSProperties}>
                    <span className={`vp-cifre__unit${f.unit.sup ? " vp-cifre__unit--sup" : ""}`}>{f.unit.text}</span>
                  </span>
                ) : null}
              </span>
              <span className="sr-only">{f.spoken ?? printed(f)}</span>
            </p>
            <div className="vp-cifre__about">
              <p className="vp-cifre__label">
                <Mark kind={f.planned ? "outline" : "solid"} className="vp-cifre__mark" />
                {f.label}
              </p>
              {f.note ? <p className="vp-cifre__note t-body">{f.note}</p> : null}
              {f.source ? <p className="vp-cifre__src t-label">{f.source}</p> : null}
            </div>
          </div>
        ))}
      </div>
      <fieldset className="vp-cifre__index">
        <legend className="sr-only">{legend}</legend>
        {figures.map((f, i) => (
          <label key={f.key} className="vp-cifre__row" style={{ "--r": i } as CSSProperties}>
            <input type="radio" name={name} value={f.key} defaultChecked={i === 0} className="sr-only" data-pick={f.key} />
            <Line figure={f} n={i + 1} />
            {f.spoken ? <span className="sr-only">{f.spoken}</span> : null}
            {/* the block, holding the same line in white: the text turns white exactly where it passes */}
            <span className="vp-cifre__band" aria-hidden="true">
              <Line figure={f} n={i + 1} />
            </span>
          </label>
        ))}
      </fieldset>
    </FiguresLive>
  );
}

const printed = (f: Figure) => `${f.value}${f.unit ? (f.unit.sup ? f.unit.text : ` ${f.unit.text}`) : ""}`;

/** A row of the index: its number, the figure's name, its value. */
function Line({ figure: f, n }: { figure: Figure; n: number }) {
  return (
    <>
      <span className="vp-cifre__ix t-num" aria-hidden="true">
        {String(n).padStart(2, "0")}
      </span>
      <span className="vp-cifre__name">{f.row}</span>
      <span className="vp-cifre__val t-num" aria-hidden={f.spoken ? true : undefined}>
        {printed(f)}
      </span>
    </>
  );
}

/**
 * The chosen figure shows: one rule per figure, since its radio and its panel are far apart in the
 * page. With motion, once the section has been seen, its words come in after its digits have
 * risen (FiguresLive rolls those).
 */
const picked = (keys: string[]) => {
  const on = (tail = "", seen = "") =>
    keys.map((k) => `${seen && "html.js-motion "}.vp-cifre${seen}:has([data-pick="${k}"]:checked) .vp-cifre__panel[data-k="${k}"]${tail}`).join(",");
  return (
    `${on()}{opacity:1;visibility:visible;transition:opacity .45s var(--ease-enter) .1s,visibility 0s}` +
    `@media (prefers-reduced-motion:no-preference){${on(" .vp-cifre__about", "[data-seen]")}{opacity:1;transition:opacity .6s var(--ease-enter) .35s}}`
  );
};
