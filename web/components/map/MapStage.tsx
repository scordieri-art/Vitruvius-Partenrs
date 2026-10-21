"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ScrollTrigger, prefersReducedMotion, setupGsap } from "@/lib/motion";

/**
 * The map's 3D plane. Flat when the section enters, tilted into depth as it reaches the
 * middle of the screen: the layered outline reads as a slab, the marks stand up.
 * Without JavaScript, or with reduced motion, it rests at the CSS default tilt.
 */
export function MapStage({ children, className = "", focused = false }: { children: ReactNode; className?: string; focused?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    setupGsap();
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      end: "center 55%",
      scrub: 0.6,
      onUpdate: (self) => el.style.setProperty("--tilt", `${(8 + self.progress * 44).toFixed(2)}deg`),
    });
    return () => {
      st.kill();
      el.style.removeProperty("--tilt");
    };
  }, []);

  return (
    <div ref={root} className={`vp-map__stage ${className}`} data-focus={focused ? "" : undefined}>
      <div className="vp-map__plane">{children}</div>
    </div>
  );
}
