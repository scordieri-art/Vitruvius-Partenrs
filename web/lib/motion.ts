"use client";

import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ScrollTriggerT } from "gsap/ScrollTrigger";

/**
 * GSAP is never among a page's first scripts: a phone opening a page does not download or
 * compile it. Entrances are CSS (RevealScope, Rise, .vp-rise); GSAP drives what only matters
 * once the reader acts — the scroll-linked effects, the titles rising line by line, the page
 * transition — and loads at the first sign of a reader (a scroll, a touch, a key, a mouse).
 */
export type Motion = { gsap: typeof Gsap; ScrollTrigger: typeof ScrollTriggerT };
export type Trigger = ReturnType<typeof ScrollTriggerT.create>;

let ready: Motion | null = null;
let loading: Promise<Motion> | null = null;

/** GSAP with ScrollTrigger and the two brand easings, loaded once. Entrances: cubic-bezier(0.22, 1, 0.36, 1) · Movements: cubic-bezier(0.65, 0, 0.35, 1) */
export function loadMotion(): Promise<Motion> {
  loading ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("gsap/CustomEase")]).then(([g, s, c]) => {
    const { gsap } = g;
    const { ScrollTrigger } = s;
    const { CustomEase } = c;
    gsap.registerPlugin(ScrollTrigger, CustomEase);
    CustomEase.create("enter", "0.22,1,0.36,1");
    CustomEase.create("move", "0.65,0,0.35,1");
    gsap.defaults({ ease: "enter", duration: 0.72 });
    ready = { gsap, ScrollTrigger };
    return ready;
  });
  return loading;
}

/** The engine if it is already there, else null: for code that can do without it. */
export const motionNow = () => ready;

let intent: Promise<void> | null = null;
/** Resolves at the reader's first scroll, touch, key or mouse movement. */
function firstIntent(): Promise<void> {
  intent ??= new Promise((resolve) => {
    const events = ["scroll", "wheel", "pointerdown", "pointermove", "touchstart", "keydown"];
    const go = () => {
      events.forEach((e) => removeEventListener(e, go, true));
      resolve();
    };
    events.forEach((e) => addEventListener(e, go, { capture: true, passive: true }));
  });
  return intent;
}

/**
 * Runs `fn` with the engine once the reader has shown intent: what only matters while scrolling
 * or clicking waits for that, and a page that is only looked at never loads it. Returns a cancel.
 */
export function whenMotion(fn: (m: Motion) => void): () => void {
  let live = true;
  firstIntent()
    .then(loadMotion)
    .then((m) => {
      if (live) fn(m);
    });
  return () => {
    live = false;
  };
}

export const DUR = { ui: 0.22, enter: 0.72, move: 0.9 } as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// the two brand easings for CSS transitions set from scripts
export const EASE = { enter: "cubic-bezier(0.22, 1, 0.36, 1)", move: "cubic-bezier(0.65, 0, 0.35, 1)" } as const;
