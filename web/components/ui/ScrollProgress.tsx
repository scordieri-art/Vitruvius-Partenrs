"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ScrollTrigger, setupGsap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/hooks";

/**
 * Exposes how far an element has travelled through the viewport as a CSS variable
 * (--sp, 0 → 1) for scroll-linked styles such as a slower photograph behind a title.
 */
export function ScrollProgress({
  children,
  className = "",
  start = "top top",
  end = "bottom top",
}: {
  children: ReactNode;
  className?: string;
  start?: string;
  end?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = el.current;
    if (!node || reduced) return;
    setupGsap();
    const st = ScrollTrigger.create({
      trigger: node,
      start,
      end,
      onUpdate: (self) => node.style.setProperty("--sp", self.progress.toFixed(4)),
    });
    return () => {
      st.kill();
      node.style.removeProperty("--sp");
    };
  }, [reduced, start, end]);

  return (
    <div ref={el} className={className}>
      {children}
    </div>
  );
}
