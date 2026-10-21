import { LOGO_PATHS, LOGO_VIEWBOX, SYMBOL_PATHS, SYMBOL_VIEWBOX } from "./logo-paths";

type Variant = "color" | "white" | "navy";

const fills = (variant: Variant) =>
  variant === "white"
    ? { primary: "var(--color-white)", secondary: "var(--color-white)", word: "var(--color-white)" }
    : variant === "navy"
      ? { primary: "var(--color-navy)", secondary: "var(--color-navy)", word: "var(--color-navy)" }
      : { primary: "var(--color-navy)", secondary: "var(--color-slate)", word: "var(--color-navy)" };

/**
 * Horizontal lockup — master vectors from artboard 2 of "Proposte_rebranding_VP.ai".
 * Brand rules: never distort, rotate, recolour freely or redraw. Minimum digital width 220 px.
 */
export function Logo({
  variant = "color",
  className,
  title = "Vitruvius & Partners",
  decorative = false,
}: {
  variant?: Variant;
  className?: string;
  title?: string;
  decorative?: boolean;
}) {
  const f = fills(variant);
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
    >
      {LOGO_PATHS.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={f[p.role]}
          fillRule={p.evenOdd ? "evenodd" : undefined}
          style={{ transition: "fill var(--dur-ui) var(--ease-move)" }}
        />
      ))}
    </svg>
  );
}

/** Symbol alone (icon use: 16 px minimum). */
export function BrandSymbol({
  variant = "color",
  className,
  title,
}: {
  variant?: Variant;
  className?: string;
  title?: string;
}) {
  const f = fills(variant);
  return (
    <svg
      viewBox={SYMBOL_VIEWBOX}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path d={SYMBOL_PATHS[0]} fill={f.primary} />
      <path d={SYMBOL_PATHS[1]} fill={f.secondary} />
    </svg>
  );
}
