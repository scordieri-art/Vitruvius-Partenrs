"use client";

import type { MouseEvent, ReactNode } from "react";
import { ButtonBody } from "./Button";

type LenisLike = { scrollTo: (target: HTMLElement, opts?: { offset?: number }) => void };

/** In-page link: smooth scroll to the section (instant with reduced motion), then move focus there. */
export function JumpLink({
  to,
  children,
  cta = false,
  primary = false,
  className = "",
}: {
  to: string;
  children: ReactNode;
  /** secondary action style (rule + text) */
  cta?: boolean;
  /** primary action style (solid block) */
  primary?: boolean;
  className?: string;
}) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById(to);
    if (!el || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    const offset = -(parseFloat(getComputedStyle(el).scrollMarginTop) || 96);
    // Lenis already honours the target's scroll-margin-top
    if (lenis && !reduce) lenis.scrollTo(el);
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "auto" });
    history.replaceState(null, "", `#${to}`);
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  };
  if (primary) {
    return (
      <a href={`#${to}`} onClick={onClick} className={`vp-btn ${className}`}>
        <ButtonBody>{children}</ButtonBody>
      </a>
    );
  }
  if (!cta) {
    return (
      <a href={`#${to}`} onClick={onClick} className={className}>
        {children}
      </a>
    );
  }
  return (
    <a href={`#${to}`} onClick={onClick} className={`vp-cta ${className}`}>
      <span className="vp-cta__rule" aria-hidden="true" />
      <span className="vp-cta__text">{children}</span>
    </a>
  );
}
