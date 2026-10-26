import type { ReactNode } from "react";

/** Inner-page opening: label · rule · a short fact (how many, since when), a large Light headline, an optional lead. */
export function PageHero({
  label,
  index,
  title,
  lead,
  children,
  theme = "paper",
}: {
  label: string;
  index?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  theme?: "paper" | "navy";
}) {
  return (
    <section data-theme={theme} className="pt-[calc(var(--header-h)+clamp(5rem,14vh,10rem))] pb-[clamp(4rem,9vw,8rem)]">
      <div className="container-x">
        {/* label and lead rise in CSS: shown with the first paint, never waiting for the scripts */}
        <p className="vp-rise t-label mb-8 flex items-center gap-3">
          <span>{label}</span>
          {index ? (
            <>
              <span aria-hidden="true" className="h-px w-10 bg-current opacity-40" />
              <span className="t-num">{index}</span>
            </>
          ) : null}
        </p>
        <h1 className="t-xl max-w-[16ch]" data-reveal="lines">
          {title}
        </h1>
        {lead ? (
          <div className="grid-12 mt-10 lg:mt-14">
            <p className="vp-rise t-body-l col-span-4 max-w-[46ch] text-[var(--fg-2)] lg:col-span-6 lg:col-start-7" style={{ animationDelay: "160ms" }}>
              {lead}
            </p>
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
