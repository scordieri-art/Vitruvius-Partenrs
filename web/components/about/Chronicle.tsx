"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { TLink } from "@/components/layout/PageTransition";
import { SymbolMark } from "@/components/marks/Mark";
import { useScrollTime } from "@/lib/useScrollTime";

type Link = { href: string; label: string };
type Figure = { value: string; unit?: string; label: string; note?: string; source: Link };
type Step = { year: string; tag: string; text: string; link?: Link; figures: Figure[]; image?: { src: string; alt: string }; mark?: boolean };
type Chart = { production: { year: string; value: number; display: string }[]; rank: { year: string; rank: number }[]; of: number };
type Copy = { production: string; ranking: string; source: string; years: string };

/** One digit of the year: a strip of 0–9 that rolls to the digit, or the digit alone when no year changes it. */
function Digit({ years, pos, active }: { years: string[]; pos: number; active: string }) {
  if (years.every((y) => y[pos] === years[0][pos])) return <span>{years[0][pos]}</span>;
  return (
    <span className="vp-chron__digit">
      <span className="vp-chron__strip" style={{ "--d": Number(active[pos]) } as CSSProperties}>
        {"0123456789".split("").map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    </span>
  );
}

/**
 * Six years in figures: the milestones and the published numbers told as one story. The section
 * holds still while the page scrolls past it, and the scroll moves time: the year rolls on, its
 * step and its figures (each with the source it comes from) take the stage, and on the right one
 * chart builds up year by year — production bars filling as time reaches them, the Top 200 line
 * drawing its climb. The rail of years below jumps to any year. Everything the stage shows is
 * also in the ordered list for screen readers; the chart repeats it for the eye.
 */
export function Chronicle({ steps, chart, copy, label }: { steps: Step[]; chart: Chart; copy: Copy; label: string }) {
  const n = steps.length;
  const years = steps.map((s) => s.year);
  const ix = (year: string) => years.indexOf(year);
  const { wrap, stage, active, go } = useScrollTime(n);

  const max = Math.max(...chart.production.map((p) => p.value));
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const ry = (rank: number) => ((rank - 1) / (chart.of - 1)) * 100;
  const [r0, r1] = chart.rank;

  return (
    <div ref={wrap} className="vp-chron" style={{ "--n": n } as CSSProperties}>
      <div ref={stage} className="vp-chron__stage">
        <div className="container-x vp-chron__grid">
          {/* the year and its step */}
          <div className="vp-chron__left">
            <p className="vp-chron__year t-num" aria-hidden="true">
              {[0, 1, 2, 3].map((k) => (
                <Digit key={k} years={years} pos={k} active={years[active]} />
              ))}
            </p>
            <ol className="vp-chron__steps" aria-label={label}>
              {steps.map((s, i) => (
                <li key={s.year} className="vp-chron__step" data-on={i === active ? "" : undefined} onFocus={() => i !== active && go(i)}>
                  <p className="t-label">
                    <span className="sr-only">{s.year} · </span>
                    {s.tag}
                  </p>
                  <p className="vp-chron__text mt-3">{s.text}</p>
                  {s.figures.length ? (
                    <ul className="sr-only">
                      {s.figures.map((f) => (
                        <li key={f.label}>
                          {`${f.label}: ${f.value}${f.unit ? ` ${f.unit}` : ""}${f.note ? ` (${f.note})` : ""}. ${copy.source}: `}
                          <TLink href={f.source.href}>{f.source.label}</TLink>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {s.link ? (
                    <TLink href={s.link.href} className="vp-ulink t-small mt-5 inline-block">
                      {s.link.label} →
                    </TLink>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          {/* the figures of the year, with sources, over the chart that grows with time */}
          <div className="vp-chron__right" aria-hidden="true">
            <div className="vp-chron__readouts">
              {steps.map((s, i) => (
                <div key={s.year} className="vp-chron__readout" data-on={i === active ? "" : undefined}>
                  {s.figures.map((f) => (
                    <div key={f.label} className="vp-chron__figure">
                      <p className="vp-chron__value t-num">
                        {f.value}
                        {f.unit ? <span className="vp-chron__unit"> {f.unit}</span> : null}
                      </p>
                      <p className="t-small mt-1">
                        {f.label}
                        {f.note ? <span className="vp-chron__note"> · {f.note}</span> : null}
                      </p>
                      <TLink href={f.source.href} className="vp-ulink t-label mt-1 inline-block" tabIndex={-1}>
                        {copy.source}: {f.source.label}
                      </TLink>
                    </div>
                  ))}
                  {s.image ? (
                    <span className="vp-chron__picture">
                      <Image src={s.image.src} alt="" fill sizes="(min-width: 1024px) 384px, 272px" className="object-cover" />
                    </span>
                  ) : null}
                  {/* the founding year: the symbol itself, outline, then solid as the year is reached */}
                  {s.mark ? <SymbolMark className="vp-chron__mark" secondary="vp-chron__sec" /> : null}
                </div>
              ))}
            </div>

            <div className="vp-chron__chart">
              <p className="vp-chron__track-title t-label">{copy.production}</p>
              <div className="vp-chron__bars">
                {chart.production.map((p) => (
                  <span key={p.year} className="vp-chron__bar" style={{ "--i": ix(p.year), "--h": p.value / max, left: `${x(ix(p.year))}%` } as CSSProperties}>
                    <span className="vp-chron__barfill" />
                    <span className="vp-chron__barvalue t-small t-num">{p.display}</span>
                  </span>
                ))}
              </div>
              <p className="vp-chron__track-title t-label">{copy.ranking}</p>
              <div className="vp-chron__rank">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  focusable="false"
                  style={{ "--a": ix(r0.year), "--b": ix(r1.year), "--xa": x(ix(r0.year)), "--xb": x(ix(r1.year)) } as CSSProperties}
                >
                  <line x1={x(ix(r0.year))} y1={ry(r0.rank)} x2={x(ix(r1.year))} y2={ry(r1.rank)} pathLength={1} className="vp-chron__rankline" />
                </svg>
                {[1, chart.of].map((r) => (
                  <span key={r} className="vp-chron__scale t-label t-num" style={{ top: `${ry(r)}%` }}>
                    {r}°
                  </span>
                ))}
                {chart.rank.map((p, k) => (
                  <span key={p.year} className="vp-chron__point" data-first={k === 0 ? "" : undefined} style={{ "--i": ix(p.year), left: `${x(ix(p.year))}%`, top: `${ry(p.rank)}%` } as CSSProperties}>
                    <span className="vp-chron__pointvalue t-small t-num">{p.rank}°</span>
                  </span>
                ))}
              </div>
              <span className="vp-chron__cursor" />
            </div>
          </div>

          {/* the rail: every year, the way to jump to it */}
          <div className="vp-chron__rail" role="group" aria-label={copy.years}>
            {steps.map((s, i) => (
              <button key={s.year} type="button" className="vp-chron__tick t-label t-num" aria-current={i === active ? "step" : undefined} onClick={() => go(i)}>
                {s.year}
              </button>
            ))}
            <span className="vp-chron__progress" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
