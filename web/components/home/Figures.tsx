import type { CSSProperties, ReactNode } from "react";
import { MARK_S, MARK_W, Mark } from "@/components/marks/Mark";
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
  /** the figure counted in marks behind it: n of them, the last one `part` long, the one `here` in full */
  tally?: { n: number; part?: number; here?: number };
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
            {f.tally ? <Field id={`vp-tally-${f.key}`} {...f.tally} planned={f.planned} /> : null}
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

/** The field of marks, in its own units: laid out in columns, as many as the figure counts. */
const FW = 480;
const FH = 400;
const r1 = (v: number) => +v.toFixed(1);

/**
 * The figure counted in marks of the symbol, a light ground beside it: one mark for each unit,
 * column after column, so the grain says how many (three hundred fine marks for the sites, thirty
 * broad ones for the cities). The value of production in millions, its last mark as long as the
 * decimal; the Top 200 as its two hundred places, the group's own in full; the planned in outline.
 * The marks are a pattern tiled over the full columns and the last one's share, so a field weighs
 * a few hundred bytes whatever it counts.
 */
function Field({ id, n, part, here, planned }: { id: string; n: number; part?: number; here?: number; planned?: boolean }) {
  const rows = Math.max(1, Math.round(Math.sqrt((n * FH) / FW)));
  const cols = Math.ceil(n / rows);
  const pitch = Math.min(FW / cols, FH / rows);
  const h = pitch * 0.5;
  // the grid's corner, and a mark's within its cell
  const gx = r1((FW - cols * pitch) / 2);
  const gy = r1((FH - rows * pitch) / 2);
  const mx = (pitch - h * (MARK_W + MARK_S)) / 2;
  const my = (pitch - h) / 2;
  const mark = (x: number, y: number, k = 1) => `M${r1(x + mx)} ${r1(y + my)}h${r1(h * MARK_W)}l${r1(h * k * MARK_S)} ${r1(h * k)}h${r1(-h * MARK_W)}z`;
  const at = (i: number, k = 1) => mark(gx + Math.floor(i / rows) * pitch, gy + (i % rows) * pitch, k);
  // the group's own place, larger, centred on its cell: one mark among the others, not a speck
  const big = (i: number, z = 2.1) => {
    const H = h * z;
    const x = gx + (Math.floor(i / rows) + 0.5) * pitch - (H * (MARK_W + MARK_S)) / 2;
    const y = gy + ((i % rows) + 0.5) * pitch - H / 2;
    return `M${r1(x)} ${r1(y)}h${r1(H * MARK_W)}l${r1(H * MARK_S)} ${r1(H)}h${r1(-H * MARK_W)}z`;
  };
  // the last mark, when it is a part of one, is drawn on its own
  const whole = part ? n - 1 : n;
  const full = Math.floor(whole / rows);
  const rest = whole % rows;
  const fill = `url(#${id})`;
  const box = `0 0 ${FW} ${FH}`;
  return (
    <>
      <svg className={`vp-cifre__field${planned ? " vp-cifre__field--planned" : ""}`} viewBox={box} aria-hidden="true" focusable="false">
        <defs>
          <pattern id={id} x={gx} y={gy} width={r1(pitch)} height={r1(pitch)} patternUnits="userSpaceOnUse">
            <path d={mark(0, 0)} />
          </pattern>
        </defs>
        {full ? <rect x={gx} y={gy} width={r1(full * pitch)} height={r1(rows * pitch)} fill={fill} /> : null}
        {rest ? <rect x={r1(gx + full * pitch)} y={gy} width={r1(pitch)} height={r1(rest * pitch)} fill={fill} /> : null}
        {part ? <path d={at(n - 1, part)} /> : null}
      </svg>
      {/* over the field, outside its fading edges: the group's place reads in full wherever it falls */}
      {here ? (
        <svg className="vp-cifre__field vp-cifre__field--here" viewBox={box} aria-hidden="true" focusable="false">
          <path d={big(here - 1)} />
        </svg>
      ) : null}
    </>
  );
}

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
 * risen (FiguresLive rolls those), and its field of marks fills column after column, as it counts.
 */
const picked = (keys: string[]) => {
  const on = (tail = "", seen = "") =>
    keys.map((k) => `${seen && "html.js-motion "}.vp-cifre${seen}:has([data-pick="${k}"]:checked) .vp-cifre__panel[data-k="${k}"]${tail}`).join(",");
  return (
    `${on()}{opacity:1;visibility:visible;transition:opacity .45s var(--ease-enter) .1s,visibility 0s}` +
    `@media (prefers-reduced-motion:no-preference){` +
    `${on(" .vp-cifre__about", "[data-seen]")}{opacity:1;transition:opacity .6s var(--ease-enter) .35s}` +
    `${on(" .vp-cifre__field", "[data-seen]")}{opacity:1;clip-path:inset(0);transition:opacity .4s var(--ease-enter) .2s,clip-path 1.1s var(--ease-move) .2s}}`
  );
};
