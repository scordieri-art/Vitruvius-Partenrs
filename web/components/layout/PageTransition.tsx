"use client";

import { usePathname, useRouter } from "next/navigation";
import Link, { type LinkProps } from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { gsap, prefersReducedMotion, setupGsap, ScrollTrigger } from "@/lib/motion";

type Navigate = (href: string, label?: string) => void;
const TransitionContext = createContext<Navigate | null>(null);

// slope of the symbol's primary mass: 99.655 / 170
const SLOPE = 99.655 / 170;

/**
 * Page transition with the brand gesture: a navy plane whose leading edge
 * follows the slope of the primary mass of the symbol (≈ 59.6°) covers the
 * page, the route changes underneath, then the plane leaves.
 */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const plane = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  // idle → covering (plane enters) → route change → revealing (plane leaves) → idle
  const phase = useRef<"idle" | "covering" | "revealing">("idle");
  const pending = useRef<string | null>(null);
  const awaiting = useRef(false);
  const tween = useRef<gsap.core.Tween | null>(null);
  const clip = useRef({ lead: 0, trail: 0 });
  const here = useRef(pathname);

  const setClip = useCallback((lead: number, trail: number) => {
    const el = plane.current;
    if (!el) return;
    clip.current = { lead, trail };
    const w = window.innerWidth;
    const h = window.innerHeight;
    const s = h * SLOPE;
    // trailing edge (left) and leading edge (right) share the brand slope
    const l = trail * (w + s) - s;
    const r = lead * (w + s) - s;
    el.style.clipPath = `polygon(${l}px 0, ${r}px 0, ${r + s}px 100%, ${l + s}px 100%)`;
  }, []);

  /** Plane leaves; the new page is already underneath. Lands on #hash targets. */
  const reveal = useCallback(
    (hash: string) => {
      phase.current = "revealing";
      const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number | Element, o: object) => void } }).__lenis;
      const target = hash ? document.getElementById(hash) : null;
      // native scroll first (ScrollTrigger may have written the old position directly), then sync Lenis
      const land = () => {
        const margin = target ? parseFloat(getComputedStyle(target).scrollMarginTop) || 80 : 0;
        const top = target ? Math.max(0, target.getBoundingClientRect().top + window.scrollY - margin) : 0;
        window.scrollTo(0, top);
        lenis?.scrollTo(top, { immediate: true, force: true });
      };
      land();
      requestAnimationFrame(() => {
        // a refresh restores the scroll position it last recorded (the previous page's):
        // land again once the new page has been measured
        ScrollTrigger.refresh();
        land();
        const c = { ...clip.current };
        tween.current?.kill();
        tween.current = gsap.to(c, {
          trail: 1,
          duration: 0.7 * (1 - c.trail),
          delay: 0.12,
          ease: "move",
          onUpdate: () => setClip(c.lead, c.trail),
          onComplete: () => {
            if (plane.current) plane.current.style.visibility = "hidden";
            setClip(0, 0);
            phase.current = "idle";
            delete document.documentElement.dataset.vpTransition;
          },
        });
        if (label.current) gsap.to(label.current, { opacity: 0, duration: 0.3, ease: "move" });
      });
    },
    [setClip],
  );

  const navigate = useCallback<Navigate>(
    (href, text) => {
      const [pathOnly] = href.split("#");
      // a click while the plane is still entering: the latest destination wins
      if (phase.current === "covering") {
        pending.current = href;
        if (label.current) label.current.textContent = text ?? "";
        return;
      }
      if (!pathOnly || pathOnly === here.current) {
        router.push(href);
        return;
      }
      if (prefersReducedMotion() || !plane.current) {
        router.push(href);
        return;
      }
      setupGsap();
      tween.current?.kill();
      const wasRevealing = phase.current === "revealing";
      phase.current = "covering";
      document.documentElement.dataset.vpTransition = "1";
      pending.current = href;
      if (label.current) label.current.textContent = text ?? "";
      plane.current.style.visibility = "visible";
      // interrupted reveal: cover again from where the plane is; otherwise enter from the left
      const c = wasRevealing ? { ...clip.current } : { lead: 0, trail: 0 };
      if (!wasRevealing) setClip(0, 0);
      const done = () => {
        const next = pending.current ?? href;
        const [nextPath, nextHash = ""] = next.split("#");
        if (nextPath === here.current) {
          reveal(nextHash);
          return;
        }
        awaiting.current = true;
        router.push(next, { scroll: false });
      };
      tween.current = wasRevealing
        ? gsap.to(c, { trail: 0, duration: Math.max(0.25, 0.7 * c.trail), ease: "move", onUpdate: () => setClip(c.lead, c.trail), onComplete: done })
        : gsap.to(c, { lead: 1, duration: 0.7, ease: "move", onUpdate: () => setClip(c.lead, c.trail), onComplete: done });
      if (label.current) gsap.fromTo(label.current, { yPercent: 150, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, delay: 0.25, ease: "enter" });
    },
    [router, setClip, reveal],
  );

  // reveal once the new route is rendered
  useEffect(() => {
    here.current = pathname;
    if (!awaiting.current) return;
    awaiting.current = false;
    const hash = (pending.current ?? "").split("#")[1] ?? "";
    pending.current = null;
    reveal(hash);
  }, [pathname, reveal]);

  return (
    <TransitionContext.Provider value={navigate}>
      {children}
      <div
        ref={plane}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[90] flex items-end bg-navy text-white"
        style={{ visibility: "hidden", clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
      >
        <div className="container-x pb-[8vh]">
          <span className="mask-line">
            <p ref={label} className="t-l" />
          </span>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}

export const useTransitionNavigate = () => useContext(TransitionContext);

type TLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    /** Short label shown on the transition plane (e.g. destination page name). */
    transitionLabel?: string;
    ref?: Ref<HTMLAnchorElement>;
  };

/** Internal link that plays the brand page transition. */
export function TLink({ href, onClick, transitionLabel, children, ref, ...rest }: TLinkProps) {
  const navigate = useTransitionNavigate();
  const target = typeof href === "string" ? href : href.pathname ?? "/";
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !navigate) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(target, transitionLabel);
  };
  return (
    <Link ref={ref} href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
