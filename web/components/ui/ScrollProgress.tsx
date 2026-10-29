"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { whenMotion, type Trigger } from "@/lib/motion";
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
    // 0 until the page scrolls: the trigger waits for the reader (lib/motion)
    let st: Trigger | undefined;
    const cancel = whenMotion(({ ScrollTrigger }) => {
      st = ScrollTrigger.create({
        trigger: node,
        start,
        end,
        onUpdate: (self) => node.style.setProperty("--sp", self.progress.toFixed(4)),
      });
    });
    return () => {
      cancel();
      st?.kill();
      node.style.removeProperty("--sp");
    };
  }, [reduced, start, end]);

  return (
    <div ref={el} className={className}>
      {children}
    </div>
  );
}
