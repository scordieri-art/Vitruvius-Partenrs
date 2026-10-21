import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { SafeImage } from "@/components/ui/SafeImage";
import { notFound } from "next/navigation";
import { Cta } from "@/components/ui/Cta";
import { TLink } from "@/components/layout/PageTransition";
import { getDictionary, getNews, getNewsItem, newsCounterpart, pressOutlet } from "@/lib/content";
import { projects } from "@/content/projects";
import { formatDate, href, locales } from "@/lib/i18n";
import { alternates } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((lang) => getNews(lang).map((n) => ({ lang, slug: n.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await getDictionary();
  const item = getNewsItem(lang, slug);
  if (!item) return {};
  const other = newsCounterpart(lang, item);
  return {
    title: item.title,
    description: item.lede || item.excerpt,
    alternates: alternates(lang, "news", lang === "it" ? { it: item.slug, en: other } : { it: other, en: item.slug }),
    openGraph: { type: "article", publishedTime: item.date, images: item.image ? [{ url: item.image }] : undefined },
  };
}

const sourceName = (label: string, url: string) =>
  label.replace(/^(LEGGI L’ARTICOLO COMPLETO|CONTINUA A LEGGERE SU:?)\s*/i, "") || url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];

/** An article: date and section, the title, the lede, the picture, then the text with its sources beside it. */
export default async function NewsArticle({ params }: PageProps<"/[lang]/news/[slug]">) {
  const { slug } = await params;
  const { lang, t } = await getDictionary();
  const n = t.newsPage;
  const all = getNews(lang);
  const item = getNewsItem(lang, slug);
  if (!item) notFound();
  const press = pressOutlet(item.title);
  const title = press?.title ?? item.title;
  const idx = all.findIndex((x) => x.slug === slug);
  const newer = idx > 0 ? all[idx - 1] : null;
  const older = idx < all.length - 1 ? all[idx + 1] : null;
  const label = (x: (typeof all)[number]) => pressOutlet(x.title)?.title ?? x.title;
  // the operation this article is about, when the case page cites it
  const project = projects.find((p) => p.newsSlug.it === slug || p.newsSlug.en === slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    datePublished: item.date,
    image: item.image ? [item.image] : undefined,
    publisher: { "@type": "Organization", name: "Vitruvius & Partners" },
    inLanguage: lang,
  };

  return (
    <RevealScope>
      <article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <header data-theme="paper" className="pt-[calc(var(--header-h)+clamp(4rem,12vh,8rem))]">
          <div className="container-x">
            <p className="t-label mb-8 flex flex-wrap items-center gap-x-3 gap-y-1" data-reveal="fade">
              <TLink href={href(lang, "news")} className="vp-ulink">
                {n.label}
              </TLink>
              <span aria-hidden="true" className="h-px w-10 bg-current opacity-40" />
              <time dateTime={item.date}>{formatDate(item.date, lang)}</time>
              {press ? <span className="text-[var(--fg)]">· {press.outlet}</span> : null}
            </p>
            <h1 className={`${title.length > 90 ? "t-m max-w-[30ch]" : "t-l max-w-[22ch]"} [text-wrap:balance]`} data-reveal="lines">
              {title}
            </h1>
            {item.lede ? (
              <div className="grid-12 mt-10 lg:mt-12">
                <p className="t-body-l col-span-4 max-w-[50ch] text-[var(--fg-2)] lg:col-span-7 lg:col-start-4" data-reveal="fade" data-reveal-delay="0.15">
                  {item.lede}
                </p>
              </div>
            ) : null}
          </div>
        </header>

        {item.image ? (
          <div data-theme="paper" className="pt-[clamp(3rem,7vw,6rem)]">
            <div className="container-x">
              <div data-reveal="image" className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9]">
                {/* drawn plate under the published image: shows while it loads or if it cannot be reached */}
                <div className="vp-plate" aria-hidden="true">
                  <span className="t-label">{press?.outlet ?? n.label}</span>
                  <span className="t-label">{formatDate(item.date, lang)}</span>
                </div>
                <SafeImage src={item.image} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover" />
              </div>
            </div>
          </div>
        ) : null}

        <div data-theme="paper" className="py-[clamp(4rem,9vw,8rem)]">
          <div className="container-x grid-12 gap-y-14">
            {/* the reading column, with the article's facts beside it on wide screens */}
            <aside className="col-span-4 lg:col-span-2 lg:row-start-1">
              <dl className="grid gap-5 border-t border-[var(--line)] pt-5 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
                <div>
                  <dt className="t-label">{n.published}</dt>
                  <dd className="t-small mt-1">
                    <time dateTime={item.date}>{formatDate(item.date, lang)}</time>
                  </dd>
                </div>
                <div>
                  <dt className="t-label">{n.category}</dt>
                  <dd className="t-small mt-1">{press ? `${n.filters.press} · ${press.outlet}` : n.filters.group}</dd>
                </div>
                {project ? (
                  <div>
                    <dt className="t-label">{t.projectsPage.label}</dt>
                    <dd className="t-small mt-1">
                      <TLink href={href(lang, "projects", project.slug[lang])} className="vp-ulink" transitionLabel={project.name}>
                        {project.name} →
                      </TLink>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </aside>
            <div className="col-span-4 lg:col-span-7 lg:col-start-4 lg:row-start-1">
              <div className="prose-vp" dangerouslySetInnerHTML={{ __html: item.html }} />
              {item.sources.length ? (
                <div className="mt-14 border-t border-[var(--line)] pt-6">
                  <p className="t-label mb-2">{t.ui.sources}</p>
                  <ul className="grid">
                    {item.sources.map((s) => (
                      <li key={s.url}>
                        <Cta href={s.url} external externalNote={t.ui.externalNew}>
                          {sourceName(s.label, s.url)} <span aria-hidden="true">↗</span>
                        </Cta>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-12">
                <Cta href={href(lang, "news")} transitionLabel={n.label}>
                  {n.back}
                </Cta>
              </div>
            </div>
          </div>
        </div>

        <nav data-theme="paper" aria-label={n.related} className="border-t border-[var(--line)]">
          <div className="container-x grid md:grid-cols-2">
            {newer ? (
              <TLink href={href(lang, "news", newer.slug)} className="group border-b border-[var(--line)] py-10 md:border-b-0 md:border-r md:pr-10" transitionLabel={label(newer)}>
                <span className="t-label">← {n.newer}</span>
                <span className="t-s mt-3 block max-w-[34ch]">
                  <span className="vp-rowtitle">{label(newer)}</span>
                </span>
              </TLink>
            ) : (
              <span className="hidden md:block" />
            )}
            {older ? (
              <TLink href={href(lang, "news", older.slug)} className="group py-10 md:pl-10 md:text-right" transitionLabel={label(older)}>
                <span className="t-label">{n.older} →</span>
                <span className="t-s mt-3 block max-w-[34ch] md:ml-auto">
                  <span className="vp-rowtitle">{label(older)}</span>
                </span>
              </TLink>
            ) : null}
          </div>
        </nav>
      </article>
    </RevealScope>
  );
}
