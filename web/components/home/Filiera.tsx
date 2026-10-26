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
 * The chain as a journey: develop → build → add value. The section, title included, holds
 * still while the page scrolls, and the scroll carries the three steps sideways, one panel
 * after the other, the next one already in view on the right. Each panel gives its photograph
 * room (whole, large, drifting a little against the movement) and beside it the step: number,
 * verb, who does it, one sentence, one published fact, the way in. The verb fills from outline
 * to navy as its panel arrives, the edge of the fill on the slope of the symbol, and stays
 * filled. Under the panels, the rail of the three steps fills with the journey and leads to
 * any of them. Every panel is in the reading order; nothing is hidden from screen readers.
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

  return (
    <div ref={wrap} className="vp-fil" style={{ "--n": n } as CSSProperties}>
      <div ref={stage} className="vp-fil__stage">
        <div className="container-x vp-fil__head">
          <p className="t-label mb-3">{label}</p>
          <h2 id={titleId} className="vp-fil__title">
            {title}
          </h2>
        </div>

        {/* the panels, carried sideways by the scroll */}
        <div className="vp-fil__view">
          <ol className="vp-fil__track" aria-label={title}>
            {steps.map((s, i) => (
              <li
                key={s.key}
                className="vp-fil__panel"
                style={{ "--i": i } as CSSProperties}
                data-on={i === active ? "" : undefined}
                onFocus={() => i !== active && go(i)}
              >
                <div className="vp-fil__photo">
                  <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 48vw, 86vw" className="object-cover" />
                </div>
                <div className="vp-fil__body">
                  <h3 className="vp-fil__verb">
                    <span className="vp-fil__num t-label t-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="vp-fil__word">
                      <span className="vp-fil__outline">{s.verb}</span>
                      <span className="vp-fil__fill" aria-hidden="true">
                        {s.verb}
                      </span>
                    </span>
                  </h3>
                  <p className="t-body mt-4">
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
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* the rail: the journey so far, and the way to any step */}
        <div className="container-x">
          <div className="vp-fil__rail" role="group" aria-label={title}>
            {steps.map((s, i) => (
              <button key={s.key} type="button" className="vp-fil__stop t-label" aria-current={i === active ? "step" : undefined} onClick={() => go(i)}>
                <span className="t-num">{String(i + 1).padStart(2, "0")}</span> {s.verb}
              </button>
            ))}
            <span className="vp-fil__progress" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
