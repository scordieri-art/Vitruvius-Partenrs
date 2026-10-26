import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { FilieraRows } from "@/components/home/FilieraRows";
import { homeSteps } from "@/content/home";
import { getDictionary } from "@/lib/content";

/** Preview of an alternative concept for the home page's chain: not linked, not indexed. */
export const metadata: Metadata = { title: "Prova · filiera", robots: { index: false, follow: false } };

export default async function ChainPreview() {
  const { lang, t } = await getDictionary();
  const h = t.home;
  return (
    <RevealScope>
      <section data-theme="paper" aria-labelledby="lines-title" className="pt-[calc(var(--header-h)+var(--section-y))] pb-[var(--section-y)]">
        <div className="container-x mb-[clamp(2.5rem,5vw,4.5rem)]">
          <p className="t-label mb-5" data-reveal="fade">
            {h.lines.label}
          </p>
          <h2 id="lines-title" className="t-l max-w-[20ch] [text-wrap:balance]" data-reveal="lines">
            {h.lines.title}
          </h2>
        </div>
        <FilieraRows steps={homeSteps(lang)} externalNote={t.ui.externalNew} label={h.lines.title} />
      </section>
    </RevealScope>
  );
}
