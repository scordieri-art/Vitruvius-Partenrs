import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { PageHero } from "@/components/ui/PageHero";
import { company } from "@/content/site";
import { getDictionary } from "@/lib/content";
import { alternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDictionary();
  return { title: t.meta.titles.privacy, alternates: alternates(lang, "privacy"), robots: { index: false } };
}

// The legal text must be supplied by the company's legal advisor before going live.
export default async function PrivacyPage() {
  const { t } = await getDictionary();
  return (
    <RevealScope>
    <>
      <PageHero label={t.privacyPage.label} title={t.privacyPage.title} />
      <section data-theme="paper" className="pb-[var(--section-y)]">
        <div className="container-x grid-12">
          <div className="prose-vp col-span-4 lg:col-span-7 lg:col-start-4">
            {t.privacyPage.body.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
            <p>
              {company.legalName} · {company.email} · {company.pec}
            </p>
          </div>
        </div>
      </section>
    </>
    </RevealScope>
  );
}
