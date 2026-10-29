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
import { loadMotion, motionNow, prefersReducedMotion, whenMotion, type Motion } from "@/lib/motion";

/** Where a project picture starts from, for the shared-image transition. */
type Morph = { rect: DOMRect; src: string };
type Navigate = (href: string, label?: string, morph?: Morph) => void;
const TransitionContext = createContext<Navigate | null>(null);

// slope of the symbol's primary mass: 99.655 / 170
const SLOPE = 99.655 / 170;

/**
 * Page transition with the brand gesture: a navy plane whose leading edge
 * follows the slope of the primary mass of the symbol (≈ 59.6°) covers the
 * page, the route changes underneath, then the plane leaves.
 *
 * Project cards use a second gesture: their picture lifts off the card and grows to fill
 * the screen, darkening at the foot like the case opening; the case loads underneath and
 * the picture dissolves into its own. Both need the route and the growth to be done.
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
  const tween = useRef<ReturnType<Motion["gsap"]["to"]> | null>(null);
  const clip = useRef({ lead: 0, trail: 0 });
  const here = useRef(pathname);
  const morphEl = useRef<HTMLDivElement>(null);
  const morphState = useRef<{ routeReady: boolean; expanded: boolean } | null>(null);

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
      const m = motionNow();
      requestAnimationFrame(() => {
        if (!m) {
          if (plane.current) plane.current.style.visibility = "hidden";
          setClip(0, 0);
          phase.current = "idle";
          delete document.documentElement.dataset.vpTransition;
          return;
        }
        // a refresh restores the scroll position it last recorded (the previous page's):
        // land again once the new page has been measured
        m.ScrollTrigger.refresh();
        land();
        const c = { ...clip.current };
        tween.current?.kill();
        tween.current = m.gsap.to(c, {
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
        if (label.current) m.gsap.to(label.current, { opacity: 0, duration: 0.3, ease: "move" });
      });
    },
    [setClip],
  );

  /** Shared image: once the case is rendered and the picture fills the screen, dissolve it. */
  const finishMorph = useCallback(() => {
    const m = morphState.current;
    const el = morphEl.current;
    const motion = motionNow();
    if (!m || !m.routeReady || !m.expanded || !el || !motion) return;
    morphState.current = null;
    phase.current = "revealing";
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o: object) => void } }).__lenis;
    const top = () => {
      window.scrollTo(0, 0);
      lenis?.scrollTo(0, { immediate: true, force: true });
    };
    top();
    requestAnimationFrame(() => {
      motion.ScrollTrigger.refresh();
      top();
      tween.current = motion.gsap.to(el, {
        opacity: 0,
        duration: 0.65,
        delay: 0.1,
        ease: "move",
        onComplete: () => {
          el.style.visibility = "hidden";
          phase.current = "idle";
          delete document.documentElement.dataset.vpTransition;
          delete document.documentElement.dataset.vpMorph;
        },
      });
    });
  }, []);

  const startMorph = useCallback(
    (href: string, from: Morph) => {
      const el = morphEl.current;
      const img = el?.querySelector("img");
      const motion = motionNow();
      if (!el || !img || !motion) return false;
      const { gsap } = motion;
      tween.current?.kill();
      img.src = from.src;
      phase.current = "covering";
      document.documentElement.dataset.vpTransition = "1";
      document.documentElement.dataset.vpMorph = "1";
      pending.current = href;
      awaiting.current = true;
      morphState.current = { routeReady: false, expanded: false };
      const r = from.rect;
      gsap.set(el, { visibility: "visible", opacity: 1, top: r.top, left: r.left, width: r.width, height: r.height });
      gsap.fromTo(el.querySelector(".vp-morph__shade"), { opacity: 0 }, { opacity: 1, duration: 0.85, ease: "move" });
      tween.current = gsap.to(el, {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        duration: 0.85,
        ease: "move",
        onComplete: () => {
          if (!morphState.current) return;
          morphState.current.expanded = true;
          finishMorph();
        },
      });
      router.push(href, { scroll: false });
      return true;
    },
    [router, finishMorph],
  );

  const navigate = useCallback<Navigate>(
    (href, text, morph) => {
      // a shared-image transition is under way: let it land
      if (morphState.current) return;
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
      // the motion engine comes with the reader's first movement: a click before it is there
      // (or with reduced motion) goes straight to the page, and asks for it for the next one
      const motion = motionNow();
      if (prefersReducedMotion() || !plane.current || !motion) {
        if (!motion) loadMotion();
        router.push(href);
        return;
      }
      if (morph && startMorph(href, morph)) return;
      const { gsap } = motion;
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
    [router, setClip, reveal, startMorph],
  );

  // the plane needs the engine: ask for it at the reader's first movement on any page, so it is
  // there by the first click even where nothing else on the page moves
  useEffect(() => whenMotion(() => {}), []);

  // reveal once the new route is rendered
  useEffect(() => {
    here.current = pathname;
    if (!awaiting.current) return;
    awaiting.current = false;
    if (morphState.current) {
      pending.current = null;
      morphState.current.routeReady = true;
      finishMorph();
      return;
    }
    const hash = (pending.current ?? "").split("#")[1] ?? "";
    pending.current = null;
    reveal(hash);
  }, [pathname, reveal, finishMorph]);

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
      <div ref={morphEl} aria-hidden="true" className="pointer-events-none fixed z-[90] overflow-hidden bg-ink" style={{ visibility: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a copy of the card picture already in the browser cache */}
        <img alt="" className="absolute inset-0 h-full w-full object-cover" />
        <span className="vp-morph__shade absolute inset-0 bg-[linear-gradient(to_top,rgb(15_23_42/0.88),rgb(15_23_42/0.4)_55%,transparent)]" />
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
    /** Project cards: the picture inside the link grows into the case opening. */
    morph?: boolean;
    ref?: Ref<HTMLAnchorElement>;
  };

/** Internal link that plays the brand page transition. */
export function TLink({ href, onClick, transitionLabel, morph, children, ref, ...rest }: TLinkProps) {
  const navigate = useTransitionNavigate();
  const target = typeof href === "string" ? href : href.pathname ?? "/";
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !navigate) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    let from: Morph | undefined;
    if (morph) {
      // the top-most loaded picture (a published photo sits over its stock placeholder)
      const imgs = [...e.currentTarget.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth > 0);
      const img = imgs[imgs.length - 1];
      const box = img?.parentElement?.getBoundingClientRect();
      if (img && box && box.width > 0) from = { rect: box, src: img.currentSrc || img.src };
    }
    navigate(target, transitionLabel, from);
  };
  return (
    <Link ref={ref} href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
