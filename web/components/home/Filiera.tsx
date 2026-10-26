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
 * The group as one stroke: develop → build → add value. The section holds still while the
 * page scrolls and the scroll runs the chain. The three verbs stand large, in outline; each
 * fills in navy as its turn comes, the fill wiping in along the slope of the symbol, and stays
 * filled: the chain adds up (outline turns into solid, never the reverse). Beside them, a
 * window cut on the same slope: each step's photograph wipes in over the last along the same
 * line. Under the verbs, who does it, what it does, one published fact and the way in. The
 * verbs are also the way to jump to a step. Every step's words are in the list for screen
 * readers; the window repeats them for the eye.
 */
export function Filiera({ steps, externalNote, label }: { steps: Step[]; externalNote: string; label: string }) {
  const n = steps.length;
  const { wrap, stage, active, go } = useScrollTime(n);

  return (
    <div ref={wrap} className="vp-fil" style={{ "--n": n } as CSSProperties}>
      <div ref={stage} className="vp-fil__stage">
        <div className="container-x vp-fil__grid">
          {/* the verbs: outline, filling in turn */}
          <div className="vp-fil__verbs" role="group" aria-label={label}>
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

          {/* the window on the slope of the symbol */}
          <div className="vp-fil__window" aria-hidden="true">
            {steps.map((s, i) => (
              <span key={s.key} className="vp-fil__pic" style={{ "--i": i } as CSSProperties}>
                <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover" />
              </span>
            ))}
          </div>

          {/* who, what, one fact, the way in */}
          <ol className="vp-fil__steps" aria-label={label}>
            {steps.map((s, i) => (
              <li key={s.key} className="vp-fil__step" data-on={i === active ? "" : undefined} onFocus={() => i !== active && go(i)}>
                <h3 className="sr-only">{s.verb}</h3>
                <p className="t-body">
                  {s.name} <span className="text-[var(--fg-2)]">· {s.kind}</span>
                </p>
                <p className="vp-fil__text mt-3">{s.text}</p>
                <div className="vp-fil__proof mt-6">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Mark className="text-[var(--fg)]" />
                    <span className="vp-fil__fig t-num">{s.proof.value}</span>
                    <span className="t-small">{s.proof.unit}</span>
                  </p>
                  <p className="t-small mt-2 text-[var(--fg-2)]">
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
                <div className="mt-6">
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
