"use client";

import { Children, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, setupGsap } from "@/lib/motion";
import { useMediaQuery, useReducedMotion } from "@/lib/hooks";

/** Below this many cards a pinned rail is a gimmick: the cards sit as a grid instead. */
const PIN_FROM = 5;

/**
 * Projects. With five or more, on wide screens with motion allowed, the section holds
 * still while the cards slide sideways with the scroll. Otherwise the title sits above
 * a row: a grid on wide screens, a swipeable row with snap points on phones and tablets.
 */
export function ProjectRail({ intro, hint, children }: { intro: ReactNode; hint?: string; children: ReactNode }) {
  const section = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 64rem)");
  const count = Children.count(children);
  const pinned = wide && !reduced && count >= PIN_FROM;

  useEffect(() => {
    const s = section.current;
    const t = track.current;
    if (!s || !t || !pinned) return;
    setupGsap();
    const distance = () => Math.max(0, t.scrollWidth - window.innerWidth);
    const tween = gsap.to(t, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: s,
        start: "top top",
        end: () => `+=${distance() * 1.4}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (bar.current) bar.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
        },
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(t, { clearProps: "transform" });
    };
  }, [pinned]);

  if (pinned) {
    return (
      <div ref={section} className="vp-rail vp-rail--pinned" data-hscroll="">
        <div ref={track} className="vp-rail__track">
          <div className="vp-rail__intro">{intro}</div>
          {children}
        </div>
        <div className="container-x absolute inset-x-0 bottom-[max(1.5rem,4vh)]" aria-hidden="true">
          <span className="block h-px w-full bg-[var(--line)]">
            <span ref={bar} className="block h-px w-full origin-left scale-x-0 bg-[var(--fg)]" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={section}>
      <div className="container-x mb-[clamp(2.5rem,5vw,4rem)]">{intro}</div>
      <div ref={track} className="vp-row container-x" data-hscroll="" style={{ "--cols": Math.min(count, 4) } as CSSProperties}>
        {children}
      </div>
      {hint ? (
        <p className="container-x t-label mt-5 lg:hidden" aria-hidden="true">
          {hint} →
        </p>
      ) : null}
    </div>
  );
}
