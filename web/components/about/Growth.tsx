import type { CSSProperties } from "react";
import { TLink } from "@/components/layout/PageTransition";
import { Mark } from "@/components/marks/Mark";
import { production, top200, type Source } from "@/content/evidence";
import { newsHref } from "@/lib/content";
import type { Locale } from "@/lib/i18n";

type Copy = {
  production: string;
  productionUnit: string;
  ranking: string;
  rankingUnit: string;
  climb: string;
  year: string;
  value: string;
  position: string;
  source: string;
};

/** "Fonte: a; b", each source a link to the news that publishes it, without repeats. */
function Sources({ lang, sources, label }: { lang: Locale; sources: Source[]; label: string }) {
  const seen = new Set<string>();
  const list = sources.filter((s) => {
    const k = s.news ?? s.url ?? s.label[lang];
    return seen.has(k) ? false : (seen.add(k), true);
  });
  return (
    <p className="t-label mt-6">
      {label}:{" "}
      {list.map((s, i) => (
        <span key={s.label[lang] + i}>
          {i ? "; " : ""}
          {s.news ? (
            <TLink href={newsHref(lang, s.news)} className="vp-ulink">
              {s.label[lang]}
            </TLink>
          ) : (
            s.label[lang]
          )}
        </span>
      ))}
    </p>
  );
}

/**
 * Two small charts of published figures: value of production by year (bars, € million) and the
 * climb in the Top 200 construction ranking (two points, the scale upside down: 1st on top).
 * Drawn in HTML on the server so the type stays at its real size at every width; the marks grow
 * in as the figure scrolls into view where CSS scroll timelines exist. Each chart carries its
 * numbers in a table for screen readers and its sources as links.
 */
export function Growth({ lang, copy }: { lang: Locale; copy: Copy }) {
  const max = Math.max(...production.map((p) => p.value));
  const [from, to] = top200.points;
  // rank → distance from the top of the plot, 1st at 0%, 200th at 100%
  const y = (rank: number) => ((rank - 1) / (top200.of - 1)) * 100;
  const X0 = 30, X1 = 86; // the two years, as % of the plot width
  const ticks = [1, 50, 100, 150, 200];

  return (
    <div className="grid-12 gap-y-20">
      {/* value of production */}
      <figure className="vp-chart col-span-4 lg:col-span-6" aria-labelledby="growth-production">
        <figcaption id="growth-production" className="border-t border-[var(--line)] pt-5">
          <span className="t-s block">{copy.production}</span>
          <span className="t-label">{copy.productionUnit}</span>
        </figcaption>
        <div className="vp-bars" aria-hidden="true">
          {production.map((p) => (
            <div key={p.year} className="vp-bars__col" style={{ "--h": `${(p.value / max) * 100}%` } as CSSProperties}>
              <span className="vp-bars__bar" />
              <span className="vp-bars__value">
                <span className="t-m t-num block">{p.display[lang]}</span>
                <span className="t-label t-num block">{p.change?.[lang] ?? " "}</span>
              </span>
              <span className="vp-bars__year t-label t-num">{p.year}</span>
            </div>
          ))}
        </div>
        <table className="sr-only">
          <thead>
            <tr>
              <th scope="col">{copy.year}</th>
              <th scope="col">{`${copy.value} (${copy.productionUnit})`}</th>
            </tr>
          </thead>
          <tbody>
            {production.map((p) => (
              <tr key={p.year}>
                <th scope="row">{p.year}</th>
                <td>
                  {p.display[lang]}
                  {p.change ? ` (${p.change[lang]})` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Sources lang={lang} sources={production.map((p) => p.source)} label={copy.source} />
      </figure>

      {/* the ranking */}
      <figure className="vp-chart col-span-4 lg:col-span-5 lg:col-start-8" aria-labelledby="growth-ranking">
        <figcaption id="growth-ranking" className="border-t border-[var(--line)] pt-5">
          <span className="t-s block">{copy.ranking}</span>
          <span className="t-label">{copy.rankingUnit}</span>
        </figcaption>
        <div className="vp-slope" aria-hidden="true">
          {ticks.map((r) => (
            <span key={r} className="vp-slope__tick t-label t-num" style={{ top: `${y(r)}%` }}>
              {r}°
            </span>
          ))}
          <svg className="vp-slope__line" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
            <line x1={X0} y1={y(from.rank)} x2={X1} y2={y(to.rank)} pathLength={1} />
          </svg>
          {[
            { p: from, x: X0, side: "start" },
            { p: to, x: X1, side: "end" },
          ].map(({ p, x, side }) => (
            <span key={p.year} className="vp-slope__point" data-side={side} style={{ left: `${x}%`, top: `${y(p.rank)}%` }}>
              <Mark className="vp-slope__mark" />
              <span className="vp-slope__value t-m t-num">{p.rank}°</span>
            </span>
          ))}
          <span className="vp-slope__climb t-label" style={{ left: `${(X0 + X1) / 2}%`, top: `${(y(from.rank) + y(to.rank)) / 2}%` }}>
            {copy.climb.replace("{n}", String(from.rank - to.rank))}
          </span>
          {[
            { year: from.year, x: X0 },
            { year: to.year, x: X1 },
          ].map(({ year, x }) => (
            <span key={year} className="vp-slope__year t-label t-num" style={{ left: `${x}%` }}>
              {year}
            </span>
          ))}
        </div>
        <table className="sr-only">
          <thead>
            <tr>
              <th scope="col">{copy.year}</th>
              <th scope="col">{copy.position}</th>
            </tr>
          </thead>
          <tbody>
            {top200.points.map((p) => (
              <tr key={p.year}>
                <th scope="row">{p.year}</th>
                <td>{`${p.rank}° / ${top200.of}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Sources lang={lang} sources={[top200.source]} label={copy.source} />
      </figure>
    </div>
  );
}
