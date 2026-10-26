import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { PageHero } from "@/components/ui/PageHero";
import { NewsCabinet } from "@/components/sections/NewsCabinet";
import { getDictionary, getNews, pressOutlet } from "@/lib/content";
import { formatDate, href } from "@/lib/i18n";
import { alternates, ogPath, share } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDictionary();
  return { title: t.meta.titles.news, description: t.meta.newsDescription, alternates: alternates(lang, "news"), ...share(lang, ogPath(lang, "news")) };
}

/** News: the archive as a cabinet, one drawer a year, the newest open (components/sections/NewsCabinet.tsx). */
export default async function NewsIndex() {
  const { lang, t } = await getDictionary();
  const n = t.newsPage;
  const items = getNews(lang).map((item) => {
    const press = pressOutlet(item.title);
    return { item, outlet: press?.outlet ?? null, title: press?.title ?? item.title };
  });

  return (
    <RevealScope>
      <PageHero label={n.label} index={n.count(items.length)} title={n.title} />

      {/* The archive: a cabinet, one drawer a year */}
      <section data-theme="paper" aria-labelledby="archive-title" className="pb-[var(--section-y)]">
        <div className="container-x">
          <h2 id="archive-title" className="sr-only">
            {n.archive}
          </h2>
          <NewsCabinet
            labels={{ ...n.filters, ...n.cabinet }}
            countLabel={n.count(-1).replace("-1", "{n}")}
            countOne={n.count(1).replace("1", "{n}")}
            cards={items.map(({ item, outlet, title }) => ({
              href: href(lang, "news", item.slug),
              title,
              outlet,
              date: formatDate(item.date, lang),
              dateIso: item.date,
              image: item.image || null,
            }))}
          />
        </div>
      </section>
    </RevealScope>
  );
}
