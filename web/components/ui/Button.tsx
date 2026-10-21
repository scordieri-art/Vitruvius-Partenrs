import type { ReactNode } from "react";
import { TLink } from "@/components/layout/PageTransition";

/**
 * Primary action: a solid block whose end is cut on the slope of the symbol.
 * One per view at most. Secondary actions use <Cta>, links use .vp-ulink.
 */
export function ButtonBody({ children, arrow = true }: { children: ReactNode; arrow?: boolean }) {
  return (
    <>
      <span className="min-w-0">{children}</span>
      {arrow ? (
        <span aria-hidden="true" className="vp-btn__arrow">
          →
        </span>
      ) : null}
    </>
  );
}

export function Button({
  href,
  children,
  external = false,
  externalNote,
  size = "md",
  arrow = true,
  className = "",
  transitionLabel,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  externalNote?: string;
  size?: "md" | "sm";
  arrow?: boolean;
  className?: string;
  transitionLabel?: string;
}) {
  const cls = `vp-btn ${size === "sm" ? "vp-btn--sm" : ""} ${className}`;
  const body = (
    <ButtonBody arrow={arrow}>
      {children}
      {external && externalNote ? <span className="sr-only"> ({externalNote})</span> : null}
    </ButtonBody>
  );
  if (external || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) {
    return (
      <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {body}
      </a>
    );
  }
  return (
    <TLink href={href} className={cls} transitionLabel={transitionLabel}>
      {body}
    </TLink>
  );
}
