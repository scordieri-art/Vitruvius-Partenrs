"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

/** Registers GSAP plugins and the two brand easings exactly once. */
export function setupGsap() {
  if (registered || typeof window === "undefined") return gsap;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  // Entrances: cubic-bezier(0.22, 1, 0.36, 1) · Movements: cubic-bezier(0.65, 0, 0.35, 1)
  CustomEase.create("enter", "0.22,1,0.36,1");
  CustomEase.create("move", "0.65,0,0.35,1");
  gsap.defaults({ ease: "enter", duration: 0.72 });
  registered = true;
  return gsap;
}

export const DUR = { ui: 0.22, enter: 0.72, move: 0.9 } as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };
