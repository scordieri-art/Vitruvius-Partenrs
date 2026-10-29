"use client";

import type Lenis from "lenis";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { prefersReducedMotion, whenMotion, type Motion } from "@/lib/motion";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * Calibrated smooth scroll (Lenis) driven by the GSAP ticker so that
 * ScrollTrigger scrubs and the WebGL scenes share one clock.
 * Only with a mouse or trackpad: touch screens keep their native scroll (Lenis would only
 * add a loop running every frame), and they never download it. Off with reduced motion.
 * It starts with the motion engine, at the reader's first movement (lib/motion).
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let instance: Lenis | null = null;
    let motion: Motion | null = null;
    const tick = (time: number) => instance?.raf(time * 1000);
    let gone = false;

    const cancel = whenMotion((m) => {
      motion = m;
      import("lenis").then(({ default: LenisCtor }) => {
        if (gone) return;
        instance = new LenisCtor({
          duration: 1.15,
          easing: (t) => 1 - Math.pow(1 - t, 3.2),
          wheelMultiplier: 0.95,
          touchMultiplier: 1.4,
          syncTouch: false,
          autoRaf: false,
        });
        instance.on("scroll", m.ScrollTrigger.update);
        m.gsap.ticker.add(tick);
        m.gsap.ticker.lagSmoothing(0);
        (window as unknown as { __lenis?: Lenis }).__lenis = instance;
        setLenis(instance);
      });
    });

    return () => {
      gone = true;
      cancel();
      motion?.gsap.ticker.remove(tick);
      instance?.destroy();
      (window as unknown as { __lenis?: Lenis }).__lenis = undefined;
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
