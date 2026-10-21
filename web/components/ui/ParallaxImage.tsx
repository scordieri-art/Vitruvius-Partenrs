"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ScrollTrigger, setupGsap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/hooks";

/**
 * A framed photograph that drifts slightly against the scroll (the frame stays, the picture moves).
 * One CSS variable per frame; still with reduced motion.
 */
export function ParallaxImage({
  src,
  alt,
  sizes,
  className = "",
  imgClassName = "",
  strength = 8,
  priority = false,
  children,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  /** travel, in % of the frame height, above and below */
  strength?: number;
  priority?: boolean;
  children?: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = frame.current;
    if (!el || reduced) return;
    setupGsap();
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => el.style.setProperty("--py", (self.progress - 0.5).toFixed(4)),
    });
    return () => {
      st.kill();
      el.style.removeProperty("--py");
    };
  }, [reduced]);

  return (
    <div ref={frame} className={`vp-parallax overflow-hidden ${className}`} style={{ "--ps": strength } as CSSProperties}>
      <div className="vp-parallax__inner">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          className={`object-cover ${imgClassName}`}
        />
      </div>
      {children}
    </div>
  );
}
