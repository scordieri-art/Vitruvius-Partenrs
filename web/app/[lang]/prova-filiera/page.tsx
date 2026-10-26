import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { Filiera } from "@/components/home/Filiera";
import { homeSteps } from "@/content/home";
import { getDictionary } from "@/lib/content";

/** The previous version of the home page's chain (verbs and photograph held while the page scrolls), kept for comparison: not linked, not indexed. */
export const metadata: Metadata = { title: "Prova · filiera", robots: { index: false, follow: false } };

export default async function ChainPreview() {
  const { lang, t } = await getDictionary();
  const h = t.home;
  return (
    <RevealScope>
      <section data-theme="paper" aria-labelledby="lines-title" className="pt-[calc(var(--header-h)+var(--section-y))]">
        <div className="container-x">
          <p className="t-label mb-5" data-reveal="fade">
            {h.lines.label}
          </p>
          <h2 id="lines-title" className="t-l max-w-[20ch] [text-wrap:balance]" data-reveal="lines">
            {h.lines.title}
          </h2>
        </div>
        <Filiera steps={homeSteps(lang)} externalNote={t.ui.externalNew} label={h.lines.title} />
      </section>
    </RevealScope>
  );
}
