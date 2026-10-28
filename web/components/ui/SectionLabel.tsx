import type { ReactNode } from "react";

/**
 * A section's label, numbered in the order of the page: the number, a short rule, the name.
 * The number is for the eye (the headings already give the order); `as="h2"` when the label is
 * the section's own heading.
 */
export function SectionLabel({ n, children, as: Tag = "p", id, className = "" }: { n: number; children: ReactNode; as?: "p" | "h2"; id?: string; className?: string }) {
  return (
    <Tag id={id} className={`vp-seclabel t-label ${className}`} data-reveal="fade">
      <span className="t-num" aria-hidden="true">
        {String(n).padStart(2, "0")}
      </span>
      <span className="vp-seclabel__rule" aria-hidden="true" />
      <span>{children}</span>
    </Tag>
  );
}
