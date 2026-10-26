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

/**
 * The chain: develop → build → add value, on a split screen. The section holds still while the
 * page scrolls and the scroll runs the three steps. Left: the title, the three verbs large and in
 * outline, each filling in navy as its turn comes (the edge of the fill on the slope of the
 * symbol) and staying filled; under them who does it, one sentence, the way in. Right: the photograph, edge to edge and full height, no frame, with the step's published
 * fact as its caption; each step's photograph rises over the last like a curtain, settling from a
 * slight zoom, while the one below drifts up more slowly. Phones: the photograph across the top,
 * the verbs and words below. The verbs lead to
 * any step; every step's words are in the list for screen readers.
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
  const two = (i: number) => String(i).padStart(2, "0");

  return (
    <div ref={wrap} className="vp-fil" style={{ "--n": n } as CSSProperties}>
      <div ref={stage} className="vp-fil__stage">
        {/* the photographs, edge to edge */}
        <div className="vp-fil__media" data-theme="navy">
          {steps.map((s, i) => (
            <span key={s.key} className="vp-fil__pic" style={{ "--i": i } as CSSProperties} aria-hidden="true">
              <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </span>
          ))}
          <span className="vp-fil__count t-label t-num" aria-hidden="true">
            {two(active + 1)} / {two(n)}
          </span>
          {/* each step's published fact, as the caption of its photograph */}
          <ul className="vp-fil__facts">
            {steps.map((s, i) => (
              <li key={s.key} className="vp-fil__fact" data-on={i === active ? "" : undefined} onFocus={() => i !== active && go(i)}>
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Mark />
                  <span className="vp-fil__fig t-num">{s.proof.value}</span>
                  <span className="t-small">{s.proof.unit}</span>
                </p>
                <p className="t-small mt-1 vp-fil__factlabel">
                  {s.proof.label}
                  {s.proof.href ? (
                    <>
                      {" · "}
                      <TLink href={s.proof.href} className="vp-ulink">
                        {s.proof.linkLabel}
                      </TLink>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="container-x vp-fil__grid">
          <div className="vp-fil__head">
            <p className="t-label mb-5">{label}</p>
            <h2 id={titleId} className="t-l vp-fil__title">
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
                  {two(i + 1)}
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

          {/* who, what, one fact, the way in */}
          <ol className="vp-fil__steps" aria-label={title}>
            {steps.map((s, i) => (
              <li key={s.key} className="vp-fil__step" data-on={i === active ? "" : undefined} onFocus={() => i !== active && go(i)}>
                <h3 className="sr-only">{s.verb}</h3>
                <p className="t-body">
                  {s.name} <span className="text-[var(--fg-2)]">· {s.kind}</span>
                </p>
                <p className="vp-fil__text mt-2">{s.text}</p>
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
