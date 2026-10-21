import type { ReactNode } from "react";

/** Inner-page opening: label · rule · index, a large Light headline, an optional lead. */
export function PageHero({
  label,
  index = "01",
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
        <p className="t-label mb-8 flex items-center gap-3" data-reveal="fade">
          <span>{label}</span>
          <span aria-hidden="true" className="h-px w-10 bg-current opacity-40" />
          <span>{index}</span>
        </p>
        <h1 className="t-xl max-w-[16ch]" data-reveal="lines">
          {title}
        </h1>
        {lead ? (
          <div className="grid-12 mt-10 lg:mt-14">
            <p className="t-body-l col-span-4 max-w-[46ch] text-[var(--fg-2)] lg:col-span-6 lg:col-start-7" data-reveal="fade" data-reveal-delay="0.2">
              {lead}
            </p>
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
