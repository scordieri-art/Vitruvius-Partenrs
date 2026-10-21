import type { ReactNode } from "react";
import { TLink } from "@/components/layout/PageTransition";

/** Primary action: a short rule that extends + text that shifts (hover 320 ms, movement easing). */
export function Cta({
  href,
  children,
  external = false,
  externalNote,
  className = "",
  transitionLabel,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  externalNote?: string;
  className?: string;
  transitionLabel?: string;
}) {
  const inner = (
    <>
      <span className="vp-cta__rule" aria-hidden="true" />
      <span className="vp-cta__text">
        {children}
        {external && externalNote ? <span className="sr-only"> ({externalNote})</span> : null}
      </span>
    </>
  );
  if (external || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={href} className={`vp-cta ${className}`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <TLink href={href} className={`vp-cta ${className}`} transitionLabel={transitionLabel}>
      {inner}
    </TLink>
  );
}
