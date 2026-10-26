"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { TLink } from "@/components/layout/PageTransition";
import { Mark } from "@/components/marks/Mark";
import { Cta } from "@/components/ui/Cta";
import type { Step } from "./Filiera";

/**
 * The chain on the home page: three rows across the page, the verbs in
 * very large type. The open row unfolds a cinematic photograph the full width of the page,
 * revealed along the slope of the symbol and settling from a slight zoom; under it the sentence,
 * the published fact and the way in. Pointing at a row (after a short pause) or choosing it
 * opens it; one row is open at a time and the first is open on arrival. The page scrolls as
 * usual: nothing is held. Every row is a disclosure button; every panel is rendered.
 */
export function FilieraRows({ steps, externalNote, label }: { steps: Step[]; externalNote: string; label: string }) {
  const [open, setOpen] = useState(0);
  const timer = useRef(0);
  const two = (i: number) => String(i).padStart(2, "0");

  // pointing opens after a short pause, so crossing the rows does not flip them all
  const point = (i: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(i), 220);
  };
  const leave = () => window.clearTimeout(timer.current);

  return (
    <ol className="vp-rows container-x" aria-label={label}>
      {steps.map((s, i) => {
        const on = i === open;
        return (
          <li key={s.key} className="vp-rows__row" data-on={on ? "" : undefined} style={{ "--i": i } as CSSProperties}>
            <h3>
              <button
                type="button"
                className="vp-rows__head"
                aria-expanded={on}
                aria-controls={`row-${s.key}`}
                onClick={() => setOpen(i)}
                onPointerEnter={() => point(i)}
                onPointerLeave={leave}
              >
                <span className="vp-rows__num t-label t-num">{two(i + 1)}</span>
                <span className="vp-rows__verb">{s.verb}</span>
                <span className="vp-rows__who t-small">
                  {s.name}
                  <span className="vp-rows__kind"> · {s.kind}</span>
                </span>
                <span className="vp-rows__sign" aria-hidden="true" />
              </button>
            </h3>
            <div className="vp-rows__panel" id={`row-${s.key}`}>
              <div className="vp-rows__inner">
                <div className="vp-rows__pic">
                  <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 92vw, 100vw" className="object-cover" />
                </div>
                <div className="vp-rows__words">
                  <p className="vp-rows__text">{s.text}</p>
                  <div className="vp-rows__proof">
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Mark className="text-[var(--fg)]" />
                      <span className="vp-rows__fig t-num">{s.proof.value}</span>
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
                  <div className="vp-rows__cta">
                    <Cta href={s.href} external={s.external} externalNote={externalNote} transitionLabel={s.linkLabel}>
                      {s.linkLabel}
                    </Cta>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
