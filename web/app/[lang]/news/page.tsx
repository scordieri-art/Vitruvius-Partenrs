import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { TLink } from "@/components/layout/PageTransition";
import { PageHero } from "@/components/ui/PageHero";
import { SafeImage } from "@/components/ui/SafeImage";
import { NewsList } from "@/components/sections/NewsList";
import { getDictionary, getNews, pressOutlet } from "@/lib/content";
import { formatDate, href } from "@/lib/i18n";
import { alternates, ogPath, share } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDictionary();
  return { title: t.meta.titles.news, description: t.meta.newsDescription, alternates: alternates(lang, "news"), ...share(lang, ogPath(lang, "news")) };
}

/** News: the three latest as cards with their picture, then the archive by year, filterable. */
export default async function NewsIndex() {
  const { lang, t } = await getDictionary();
  const n = t.newsPage;
  const items = getNews(lang).map((item) => {
    const press = pressOutlet(item.title);
    return { item, outlet: press?.outlet ?? null, title: press?.title ?? item.title };
  });
  const latest = items.slice(0, 3);

  return (
    <RevealScope>
      <PageHero label={n.label} index={n.count(items.length)} title={n.title} />

      {/* Latest */}
      <section data-theme="paper" aria-labelledby="latest-title" className="pb-[clamp(4.5rem,9vw,8rem)]">
        <h2 id="latest-title" className="container-x t-label mb-6">
          {n.latest}
        </h2>
        <ul className="vp-row container-x" data-hscroll="">
          {latest.map(({ item, outlet, title }, i) => (
            <li key={item.slug}>
              <TLink href={href(lang, "news", item.slug)} transitionLabel={title} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden" data-reveal="image">
                  <div className="vp-plate" aria-hidden="true">
                    <span className="t-label">{outlet ?? n.label}</span>
                    <span className="t-label t-num">{item.date.slice(0, 4)}</span>
                  </div>
                  {item.image ? (
                    <SafeImage
                      src={item.image}
                      alt=""
                      fill
                      loading={i === 0 ? "eager" : undefined}
                      fetchPriority={i === 0 ? "high" : undefined}
                      sizes="(min-width: 1024px) 31vw, 78vw"
                      className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-enter)] group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <p className="t-label mt-5">
                  <time dateTime={item.date}>{formatDate(item.date, lang)}</time>
                  {outlet ? <span className="text-[var(--fg)]"> · {outlet}</span> : null}
                </p>
                <h3 className="t-s mt-3 flex items-start justify-between gap-5">
                  <span className="min-w-0">
                    <span className="vp-rowtitle">{title}</span>
                  </span>
                  <span aria-hidden="true" className="vp-go">
                    →
                  </span>
                </h3>
              </TLink>
            </li>
          ))}
        </ul>
      </section>

      {/* Archive */}
      <section data-theme="paper" aria-labelledby="archive-title" className="border-t border-[var(--line)] pt-[clamp(3.5rem,7vw,6rem)] pb-[var(--section-y)]">
        <div className="container-x">
          <h2 id="archive-title" className="t-l mb-8" data-reveal="lines">
            {n.archive}
          </h2>
          <NewsList
            labels={n.filters}
            countLabel={n.count(-1).replace("-1", "{n}")}
            rows={items.map(({ item, outlet, title }) => ({
              href: href(lang, "news", item.slug),
              title,
              outlet,
              date: formatDate(item.date, lang),
              dateIso: item.date,
            }))}
          />
        </div>
      </section>
    </RevealScope>
  );
}
