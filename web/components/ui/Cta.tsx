import type { ReactNode } from "react";
import { TLink } from "@/components/layout/PageTransition";

/**
 * Primary action: a short rule that extends + text that shifts (hover 320 ms, movement easing).
 * `lead`: an optional mark before the rule, such as the logo of the site it leads to.
 */
export function Cta({
  href,
  children,
  external = false,
  externalNote,
  className = "",
  transitionLabel,
  lead,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  externalNote?: string;
  className?: string;
  transitionLabel?: string;
  lead?: ReactNode;
}) {
  const inner = (
    <>
      {lead ? <span className="vp-cta__lead">{lead}</span> : null}
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
