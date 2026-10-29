"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { Button } from "@/components/ui/Button";
import { JumpLink } from "@/components/ui/JumpLink";
import { whenMotion, type Trigger } from "@/lib/motion";
import { useReducedMotion } from "@/lib/hooks";

type HeroCopy = { label: string; title: string[]; lead: string; cta: string; scroll: string };

/**
 * Opening. Wide screens: a navy mass cut on the slope of the symbol, over a photograph;
 * scrolling wipes the mass away along the same slope and the photograph takes the frame.
 * The title stands large at the foot of the mass, each line set in by the slope, so its
 * left edge runs parallel to the cut. Phones and tablets: the photograph above, the mass
 * below, rising into the picture with a step cut on the slope. Two ways on: the offer of a
 * property, and the operations below. The words come in with CSS alone, from the first
 * paint, never waiting for the scripts. With reduced motion everything is still.
 */
export function Hero({ copy, image, propose }: { copy: HeroCopy; image: string; propose: { label: string; href: string } }) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    // the wipe only matters once the page scrolls: it waits for the reader (lib/motion)
    let st: Trigger | undefined;
    const cancel = whenMotion(({ ScrollTrigger }) => {
      st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => el.style.setProperty("--p", self.progress.toFixed(4)),
      });
    });
    return () => {
      cancel();
      st?.kill();
      el.style.removeProperty("--p");
    };
  }, [reduced]);

  return (
    <section ref={root} data-theme="navy" aria-labelledby="hero-title" className="vp-hero">
      <div className="vp-hero__img">
        <Image src={image} alt="" fill preload fetchPriority="high" sizes="100vw" className="object-cover" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,rgb(10_35_66/0.6),transparent)]" />
      <div className="vp-hero__mass">
        <div className="vp-hero__body container-x flex flex-col justify-end">
          <p className="vp-rise t-label mb-6 text-[var(--fg-2)]">{copy.label}</p>
          <h1 id="hero-title" className="vp-hero__title">
            {/* a space between the lines: invisible between blocks, but the title reads as words when taken as text */}
            {copy.title.map((line, i) => (
              <Fragment key={line}>
                {i > 0 ? " " : null}
                <span className="vp-hero__line" style={{ "--i": i } as CSSProperties}>
                  <span className="vp-hero__word">{line}</span>
                </span>
              </Fragment>
            ))}
          </h1>
          <p className="vp-hero__lead vp-rise t-body-l mt-6 max-w-[30ch] text-[var(--fg-2)]">{copy.lead}</p>
          <div className="vp-hero__ctas vp-rise mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
            <Button href={propose.href}>{propose.label}</Button>
            <JumpLink to="progetti" cta>
              {copy.cta}
            </JumpLink>
          </div>
        </div>
      </div>
      <div className="vp-scrollcue absolute bottom-[max(2rem,6vh)] right-[max(var(--gutter-x),env(safe-area-inset-right,0px))] z-[1] hidden text-white lg:flex" aria-hidden="true">
        <span className="t-label text-white/80 [writing-mode:vertical-rl]">{copy.scroll}</span>
        <span className="vp-scrollcue__line" />
      </div>
    </section>
  );
}
