"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { TLink } from "@/components/layout/PageTransition";
import { Mark } from "@/components/marks/Mark";
import { Cta } from "@/components/ui/Cta";
import { useScrollTime } from "@/lib/useScrollTime";

export type Step = {
  key: string;
  verb: string;
  name: string;
  kind: string;
  text: string;
  image: string;
  href: string;
  linkLabel: string;
  external: boolean;
  proof: { value: string; unit: string; label: string; href?: string; linkLabel?: string };
};

/*
 * The symbol of the brand (public/brand/vp-simbolo.svg, 269.655 × 170): the long stroke and the
 * wedge, as shares of its box, for CSS polygons.
 */
const STROKE = "0 0, 34.78% 0, 71.74% 100%, 36.96% 100%";
const WEDGE = "58.70% 0, 100% 0, 76.09% 56.90%";
const STROKE_SVG = "0,0 93.793,0 193.448,170 99.655,170";
/** the bounding boxes of the two pieces, so each photograph is framed on its own piece */
const WEDGE_BOX = { left: "58.70%", top: 0, width: "41.30%", height: "56.90%" };
const STROKE_BOX = { left: 0, top: 0, width: "71.74%", height: "100%" };
const WEDGE_SVG = "158.276,0 269.655,0 205.173,96.724";

/**
 * The chain builds the mark. The section holds still while the page scrolls, and the scroll runs
 * the three steps of the group: develop → build → add value. On the left the three verbs, large,
 * in outline: each fills in navy as its turn comes, the edge of the fill on the slope of the
 * symbol, and stays filled. On the right, the symbol of the brand drawn in outline, used as a
 * window: developing fills the wedge with the city; building fills the long stroke from the
 * ground up with the building site; adding value runs one photograph across the whole symbol,
 * now complete. Outline turns into solid, never the reverse. Under the verbs: who does it, one
 * sentence, one published fact, the way in. Title and steps stay together on the held stage.
 */
export function Filiera({
  steps,
  externalNote,
  label,
  title,
  titleId,
}: {
  steps: Step[];
  externalNote: string;
  label: string;
  title: string;
  titleId: string;
}) {
  const n = steps.length;
  const { wrap, stage, active, go } = useScrollTime(n);
  const [develop, build, value] = steps;

  return (
    <div ref={wrap} className="vp-fil" style={{ "--n": n } as CSSProperties}>
      <div ref={stage} className="vp-fil__stage">
        <div className="container-x vp-fil__grid">
          <div className="vp-fil__head">
            <p className="t-label mb-3">{label}</p>
            <h2 id={titleId} className="vp-fil__title">
              {title}
            </h2>
          </div>

          {/* the verbs: outline, filling in turn */}
          <div className="vp-fil__verbs" role="group" aria-label={title}>
            {steps.map((s, i) => (
              <button
                key={s.key}
                type="button"
                className="vp-fil__verb"
                style={{ "--i": i } as CSSProperties}
                aria-current={i === active ? "step" : undefined}
                onClick={() => go(i)}
              >
                <span className="vp-fil__num t-label t-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="vp-fil__word">
                  <span className="vp-fil__outline">{s.verb}</span>
                  <span className="vp-fil__fill" aria-hidden="true">
                    {s.verb}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* the symbol as a window, built by the three steps */}
          <div className="vp-fil__mark" aria-hidden="true">
            {/* each of the first two photographs framed on its own piece of the symbol */}
            <span className="vp-fil__shape" style={{ clipPath: `polygon(${WEDGE})` }}>
              <span className="vp-fil__box" style={WEDGE_BOX}>
                <Image src={develop.image} alt="" fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover object-[50%_70%]" />
              </span>
            </span>
            <span className="vp-fil__shape" style={{ clipPath: `polygon(${STROKE})` }}>
              <span className="vp-fil__rise" style={STROKE_BOX}>
                <Image src={build.image} alt="" fill sizes="(min-width: 1024px) 34vw, 66vw" className="object-cover" />
              </span>
            </span>
            {[WEDGE, STROKE].map((shape) => (
              <span key={shape} className="vp-fil__shape" style={{ clipPath: `polygon(${shape})` }}>
                <span className="vp-fil__sweep">
                  <Image src={value.image} alt="" fill sizes="(min-width: 1024px) 46vw, 92vw" className="object-cover" />
                </span>
              </span>
            ))}
            <svg className="vp-fil__lines" viewBox="0 0 269.655 170" preserveAspectRatio="none" focusable="false">
              <polygon points={WEDGE_SVG} />
              <polygon points={STROKE_SVG} />
            </svg>
          </div>

          {/* who, what, one fact, the way in */}
          <ol className="vp-fil__steps" aria-label={title}>
            {steps.map((s, i) => (
              <li key={s.key} className="vp-fil__step" data-on={i === active ? "" : undefined} onFocus={() => i !== active && go(i)}>
                <h3 className="sr-only">{s.verb}</h3>
                <p className="t-body">
                  {s.name} <span className="text-[var(--fg-2)]">· {s.kind}</span>
                </p>
                <p className="vp-fil__text mt-2">{s.text}</p>
                <div className="vp-fil__proof">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Mark className="text-[var(--fg)]" />
                    <span className="vp-fil__fig t-num">{s.proof.value}</span>
                    <span className="t-small">{s.proof.unit}</span>
                  </p>
                  <p className="t-small mt-1 text-[var(--fg-2)]">
                    {s.proof.label}
                    {s.proof.href ? (
                      <>
                        {" · "}
                        <TLink href={s.proof.href} className="vp-ulink text-[var(--fg)]">
                          {s.proof.linkLabel}
                        </TLink>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="vp-fil__cta">
                  <Cta href={s.href} external={s.external} externalNote={externalNote} transitionLabel={s.linkLabel}>
                    {s.linkLabel}
                  </Cta>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
