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
  /** the company's own logo; f: its optical size, 1 for the most compact */
  logo: { src: string; w: number; h: number; f: number };
  /** the company whose site the way in leads to, shown by its logo before the link; f as for `logo` */
  site?: { src: string; w: number; h: number; name: string; f?: number };
  text: string;
  image: string;
  href: string;
  linkLabel: string;
  external: boolean;
  proof: { value: string; unit: string; label: string; href?: string; linkLabel?: string };
};

/**
 * The group as one stroke: develop → build → add value, and who does each. The section holds
 * still while the page scrolls and the scroll runs the chain. The three verbs stand large, in
 * outline, each with the logo of the company that does it, in its own colours. Each verb fills
 * in navy as its turn comes, the fill wiping in along the slope of the symbol, and the same
 * stroke runs on along the rule under the row to the logo, which comes into full colour: the
 * verb is signed. What is filled stays filled: the chain adds up (outline turns into solid,
 * never the reverse). Beside them, a window: each step's photograph wipes in over the last
 * along the same line. Under the verbs, what the company does, one published fact and the way
 * in. The verbs are also the way to jump to a step. Every step's words are in the list for
 * screen readers; the window repeats them for the eye.
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
                {/* the verb once: the outline is the text, the fill is drawn over it from data-verb */}
                <span className="vp-fil__word" data-verb={s.verb}>
                  <span className="vp-fil__outline">{s.verb}</span>
                </span>
                {/* who does it: the company's logo */}
                <span className="vp-fil__logo" style={{ "--lf": s.logo.f } as CSSProperties}>
                  <Image src={s.logo.src} alt={s.name} width={s.logo.w} height={s.logo.h} unoptimized={s.logo.src.endsWith(".svg")} sizes="16rem" />
                </span>
              </button>
            ))}
          </div>

          {/* phones and tablets: where the chain stands, the step and a rule filling with the scroll */}
          <p className="vp-fil__count t-label t-num" aria-hidden="true">
            <span>
              {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
            <span className="vp-fil__bar" />
          </p>

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
                <h3 className="sr-only">
                  {s.verb}: {s.name}
                </h3>
                <p className="vp-fil__text">{s.text}</p>
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
                  <Cta
                    href={s.href}
                    external={s.external}
                    externalNote={externalNote}
                    transitionLabel={s.linkLabel}
                    // a long logo goes on a line of its own on phones
                    className={s.site && s.site.w / s.site.h > 3 ? "vp-cta--stack" : ""}
                    lead={
                      s.site ? (
                        <Image
                          src={s.site.src}
                          alt={s.site.name}
                          width={s.site.w}
                          height={s.site.h}
                          unoptimized={s.site.src.endsWith(".svg")}
                          sizes="12rem"
                          className="vp-fil__site"
                          style={{ "--sf": s.site.f ?? 1 } as CSSProperties}
                        />
                      ) : undefined
                    }
                  >
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
