"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ScrollTrigger, prefersReducedMotion, setupGsap } from "@/lib/motion";

type View = { x: number; y: number; w: number; h: number };

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The model's 3D stage. Flat when the section enters, tilted into depth as it reaches the
 * middle of the screen: the layers read as a raised model, the marks stand up.
 *
 * With `targets` (the map with its list), hovering or focusing a list entry on a wide screen
 * eases the cartography onto that place by moving every layer's SVG viewBox, so it is redrawn
 * sharp at each frame; the marks follow. Without JavaScript, or with reduced motion, the model
 * rests at the CSS default tilt and shows the whole sheet.
 */
export function MapStage({
  children,
  className = "",
  focused = false,
  sheet,
  view,
  targets,
}: {
  children: ReactNode;
  className?: string;
  focused?: boolean;
  sheet: View;
  view: View;
  targets?: Record<string, View>;
}) {
  const root = useRef<HTMLDivElement>(null);

  // tilt with the scroll
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    setupGsap();
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      end: "center 55%",
      scrub: 0.6,
      onUpdate: (self) => el.style.setProperty("--tilt", `${(8 + self.progress * 40).toFixed(2)}deg`),
    });
    return () => {
      st.kill();
      el.style.removeProperty("--tilt");
    };
  }, []);

  // zoom onto the place of the hovered or focused list entry
  useEffect(() => {
    const el = root.current;
    const figure = el?.closest(".vp-map");
    if (!el || !figure || !targets || prefersReducedMotion() || !matchMedia("(hover: hover) and (min-width: 64rem)").matches) return;
    const layers = Array.from(el.querySelectorAll<SVGSVGElement>("svg.vp-map__cut"));
    const pins = Array.from(el.querySelectorAll<HTMLElement>(".vp-map__pin")).map((p) => ({ el: p, x: Number(p.dataset.x), y: Number(p.dataset.y) }));
    let current = { ...view };
    let raf = 0;
    const draw = (v: View) => {
      const box = `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`;
      layers.forEach((l) => l.setAttribute("viewBox", box));
      // labels and dots keep their size on screen at every zoom
      el.style.setProperty("--zoomk", (v.w / sheet.w).toFixed(4));
      pins.forEach((p) => {
        const left = ((p.x - v.x) / v.w) * 100, top = ((p.y - v.y) / v.h) * 100;
        p.el.style.left = `${left}%`;
        p.el.style.top = `${top}%`;
        p.el.style.visibility = left < 0 || left > 100 || top < 0 || top > 100 ? "hidden" : "";
      });
      current = v;
    };
    const go = (to: View) => {
      cancelAnimationFrame(raf);
      const from = { ...current }, t0 = performance.now(), D = 900;
      const step = (now: number) => {
        const k = ease(Math.min(1, (now - t0) / D));
        draw({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k });
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    let leaveTimer = 0;
    const onEnter = (e: Event) => {
      const k = (e.target as HTMLElement).closest<HTMLElement>(".vp-map__item")?.dataset.k;
      if (!k || !targets[k]) return;
      clearTimeout(leaveTimer);
      go(targets[k]);
    };
    // a short grace, so moving from one entry to the next does not bounce out to the whole sheet
    const onLeave = () => {
      clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(() => go(sheet), 180);
    };
    const items = Array.from(figure.querySelectorAll<HTMLElement>(".vp-map__item"));
    items.forEach((i) => {
      i.addEventListener("pointerenter", onEnter);
      i.addEventListener("focusin", onEnter);
      i.addEventListener("pointerleave", onLeave);
      i.addEventListener("focusout", onLeave);
    });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(leaveTimer);
      items.forEach((i) => {
        i.removeEventListener("pointerenter", onEnter);
        i.removeEventListener("focusin", onEnter);
        i.removeEventListener("pointerleave", onLeave);
        i.removeEventListener("focusout", onLeave);
      });
    };
  }, [targets, sheet, view]);

  return (
    <div
      ref={root}
      className={`vp-map__stage ${className}`}
      data-focus={focused ? "" : undefined}
      style={{ "--zoomk": (view.w / sheet.w).toFixed(4) } as CSSProperties}
    >
      <div className="vp-map__plane">{children}</div>
    </div>
  );
}
