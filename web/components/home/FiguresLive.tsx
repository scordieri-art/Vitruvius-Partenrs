"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** The roll of the digits: --ease-move, one slot (115% of a digit's box) in 0.7s, a digit after the other */
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const ROLL = 700;
const STEP = 25;

/**
 * What «In numeri» (Figures) adds with scripts. The entrance, played when the section comes into
 * view (data-seen: the first figure rises, the rows come in; data-drawn, a moment later: the chosen
 * row's block draws). With a mouse, a row chosen when the pointer rests on it (a short wait, so
 * crossing the index on the way elsewhere chooses nothing). And with motion, the roll of the
 * digits as the choice changes: the figure going rolls up through its edge while the one chosen
 * rises in step from under it, a slot below, so the two never touch; each roll starts from where
 * its digits are, so a change of mind halfway carries on smoothly. Everything else is the radio
 * group and CSS (without scripts or motion, the figures cross-fade).
 */
export function FiguresLive({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const motion = document.documentElement.classList.contains("js-motion");
    const panel = (k?: string) => (k ? el.querySelector<HTMLElement>(`.vp-cifre__panel[data-k="${k}"]`) : null);
    // up (out of sight above the edge) or in (from under the edge, or from wherever it was going)
    const roll = (p: HTMLElement | null, dir: "up" | "in") =>
      p?.querySelectorAll<HTMLElement>(".vp-cifre__ch").forEach((ch, i) => {
        const moving = ch.getAnimations().some((a) => a.playState === "running");
        const from = dir === "up" || moving ? getComputedStyle(ch).translate : "0 115%";
        ch.getAnimations().forEach((a) => a.cancel());
        ch.animate([{ translate: from === "none" ? "0 0" : from }, { translate: dir === "up" ? "0 -115%" : "0 0" }], {
          duration: ROLL,
          delay: i * STEP,
          easing: EASE,
          fill: "both",
        });
      });

    let current = el.querySelector<HTMLInputElement>("input:checked")?.value;
    const show = (k: string) => {
      if (k === current) return;
      const prev = current;
      current = k;
      if (!motion || !el.hasAttribute("data-seen")) return;
      roll(panel(prev), "up");
      roll(panel(k), "in");
    };
    const change = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.checked) show(input.value);
    };
    el.addEventListener("change", change);

    let drawn = 0;
    const seen = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        seen.disconnect();
        el.setAttribute("data-seen", "");
        if (motion) roll(panel(current), "in");
        drawn = window.setTimeout(() => el.setAttribute("data-drawn", ""), 450);
      },
      { threshold: 0.35 },
    );
    seen.observe(el);

    let wait = 0;
    const rows = matchMedia("(hover: hover) and (pointer: fine)").matches ? Array.from(el.querySelectorAll<HTMLLabelElement>(".vp-cifre__row")) : [];
    const enter = (e: PointerEvent) => {
      const input = (e.currentTarget as HTMLElement).querySelector("input");
      clearTimeout(wait);
      wait = window.setTimeout(() => {
        if (!input || input.checked) return;
        input.checked = true;
        show(input.value);
      }, 110);
    };
    const leave = () => clearTimeout(wait);
    rows.forEach((r) => {
      r.addEventListener("pointerenter", enter);
      r.addEventListener("pointerleave", leave);
    });
    return () => {
      seen.disconnect();
      clearTimeout(drawn);
      clearTimeout(wait);
      el.removeEventListener("change", change);
      rows.forEach((r) => {
        r.removeEventListener("pointerenter", enter);
        r.removeEventListener("pointerleave", leave);
      });
    };
  }, []);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
