import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RevealScope } from "@/components/layout/RevealScope";
import { TLink } from "@/components/layout/PageTransition";
import { ProjectImage } from "@/components/cases/ProjectImage";
import { StageTrack } from "@/components/cases/StageTrack";
import { Mark } from "@/components/marks/Mark";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Cta } from "@/components/ui/Cta";
import { MapSlab } from "@/components/map/ItalyMap";
import { company } from "@/content/site";
import { findProject, projects } from "@/content/projects";
import { getDictionary } from "@/lib/content";
import { href, locales } from "@/lib/i18n";
import { alternates } from "@/lib/seo";

const mapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export function generateStaticParams() {
  return locales.flatMap((lang) => projects.map((p) => ({ lang, slug: p.slug[lang] })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/progetti/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await getDictionary();
  const p = findProject(lang, slug);
  if (!p) return {};
  return { title: `${p.name}, ${p.place[lang]}`, description: p.summary[lang], alternates: alternates(lang, "projects", p.slug) };
}

/** A case: the picture first, then a sentence, the figures, two short paragraphs and where it stands. */
export default async function ProjectPage({ params }: PageProps<"/[lang]/progetti/[slug]">) {
  const { slug } = await params;
  const { lang, t } = await getDictionary();
  const p = findProject(lang, slug);
  if (!p) notFound();
  const c = t.cases;
  const label = t.home.projects.placeholder;
  const i = projects.indexOf(p);
  const next = projects[(i + 1) % projects.length];
  const newsSlug = lang === "it" ? p.newsSlug.it : p.newsSlug.en;

  return (
    <RevealScope>
      <article>
        {/* Opening: the picture full frame, the name over it */}
        <header data-theme="ink">
          <ScrollProgress className="relative flex min-h-[max(88svh,34rem)] flex-col justify-end overflow-hidden">
          <div className="absolute inset-0" data-reveal="image">
            <ProjectImage p={p} lang={lang} label={label} sizes="100vw" priority className="vp-slow h-full w-full" tagClassName="right-[max(1.5rem,6vw)] top-24" />
          </div>
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[30%] bg-[linear-gradient(to_bottom,rgb(15_23_42/0.6),transparent)]" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(to_top,rgb(15_23_42/0.88),rgb(15_23_42/0.4)_55%,transparent)]" />
          <div className="vp-fadeout relative container-x pb-[max(3.5rem,9vh)] pt-40">
            <p className="t-label mb-6 flex flex-wrap items-center gap-x-3 gap-y-1" data-reveal="fade">
              <TLink href={href(lang, "projects")} className="vp-ulink">
                {t.projectsPage.label}
              </TLink>
              <span aria-hidden="true" className="h-px w-8 bg-current opacity-40" />
              <span className="flex items-center gap-2 text-white">
                <Mark />
                {p.status[lang]} · <span className="t-num">{p.year}</span>
              </span>
            </p>
            <h1 className="t-hero max-w-[12ch]" data-reveal="lines">
              {p.name}
            </h1>
            <p className="t-body-l mt-5 text-[var(--fg-2)]" data-reveal="fade" data-reveal-delay="0.2">
              {p.address[lang]}
            </p>
          </div>
          </ScrollProgress>
        </header>

        {/* The sentence and the figures */}
        <section data-theme="paper" className="pt-[var(--section-y)]">
          <div className="container-x">
            <p className="t-m max-w-[30ch]" data-reveal="lines">
              {p.summary[lang]}
            </p>
            {p.figures.length ? (
              <dl className="mt-[clamp(3.5rem,8vw,6rem)] grid gap-x-[var(--col-gap)] gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {p.figures.map((f) => (
                  <div key={f.label.it} className="flex min-w-0 flex-col border-t border-[var(--line)] pt-6" data-reveal="fade">
                    <dt className="t-small order-2 mt-3 flex items-center gap-2 text-[var(--fg-2)]">
                      <Mark kind={f.kind === "documented" ? "solid" : "outline"} className="text-[var(--fg)]" />
                      <span>
                        {f.label[lang]}
                        {f.kind === "target" ? ` · ${c.kinds.target}` : ""}
                      </span>
                    </dt>
                    <dd className="order-1 flex flex-wrap items-baseline gap-x-3">
                      <span className="vp-count t-num">{lang === "en" ? f.value.replace(/(\d),(\d)/, "$1.$2") : f.value}</span>
                      <span className="t-body text-[var(--fg-2)]">{f.unit[lang]}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </section>

        {/* The case at a glance: a fact sheet that stays in view, with the place on the map; the story beside it */}
        <section data-theme="paper" aria-labelledby="sheet-title" className="pb-[var(--section-y)] pt-[clamp(4.5rem,9vw,8rem)]">
          <div className="container-x grid-12 gap-y-14">
            <aside className="col-span-4 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:col-span-4 lg:self-start">
              <h2 id="sheet-title" className="t-label mb-5">
                {c.sheet}
              </h2>
              <dl className="vp-sheet">
                {[
                  [c.place, p.place[lang]],
                  [c.address, p.address[lang]],
                  [c.year, p.year],
                  [c.stages, p.status[lang]],
                  [c.role, p.role[lang]],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="t-label">{k}</dt>
                    <dd className="t-body">{v}</dd>
                  </div>
                ))}
              </dl>
              <figure className="mt-10 grid gap-5" aria-label={c.mapLabel}>
                <MapSlab
                  places={[
                    ...company.offices.map((o) => ({ key: o.key, lat: o.coords.lat, lon: o.coords.lon, kind: "office" as const })),
                    { key: p.slug.it, lat: p.coords.lat, lon: p.coords.lon, kind: "project" as const },
                  ]}
                  focus={p.slug.it}
                  className="max-w-[16rem] lg:mx-0"
                />
                <div>
                  <Cta href={mapsUrl(p.address.it)} external externalNote={t.ui.externalNew}>
                    {c.maps}
                  </Cta>
                </div>
              </figure>
            </aside>

            <div className="col-span-4 grid gap-[clamp(3rem,6vw,4.5rem)] lg:col-span-7 lg:col-start-6">
              <div data-reveal="fade">
                <h2 className="t-label">{c.context}</h2>
                <p className="t-body-l mt-4">{p.context[lang]}</p>
              </div>
              <div data-reveal="fade">
                <h2 className="t-label">{c.contribution}</h2>
                <p className="t-body-l mt-4">{p.contribution[lang]}</p>
                <ul className="mt-8 flex flex-wrap gap-2" aria-label={c.capabilities}>
                  {p.capabilities[lang].map((cap) => (
                    <li key={cap} className="t-small border border-[var(--line)] px-3 py-1.5">
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-[var(--line)] pt-10">
                <h2 className="t-label mb-8">{c.stages}</h2>
                <StageTrack
                  stages={p.stages.map((st) => ({ label: st.label[lang], when: st.when[lang], done: st.done }))}
                  doneLabel={c.legend.done}
                  plannedLabel={c.legend.planned}
                />
              </div>
              <div className="grid gap-10 border-t border-[var(--line)] pt-10 sm:grid-cols-2">
                <div>
                  <h2 className="t-label">{c.outcome}</h2>
                  <p className="t-body mt-4">{p.outcome.text[lang]}</p>
                </div>
                <div>
                  <h2 className="t-label">{c.sources}</h2>
                  <p className="t-body mt-4 flex flex-wrap gap-x-5 gap-y-2">
                    {newsSlug ? (
                      <TLink href={href(lang, "news", newsSlug)} className="vp-ulink">
                        {c.newsLink}
                      </TLink>
                    ) : null}
                    {p.sources.slice(0, 3).map((src) => (
                      <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" className="vp-ulink">
                        {src.label} <span aria-hidden="true">↗</span>
                        <span className="sr-only"> ({t.ui.externalNew})</span>
                      </a>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {p.quote ? (
          <section data-theme="navy" className="py-[clamp(5rem,11vw,10rem)]">
            <div className="container-x grid-12">
              <blockquote className="col-span-4 lg:col-span-9 lg:col-start-3">
                <p className="t-l [text-wrap:balance]" data-reveal="lines">
                  «{p.quote.text[lang]}»
                </p>
                <footer className="t-body mt-8 text-[var(--fg-2)]">
                  {p.quote.author}, {p.quote.role[lang].toLowerCase()} · {p.quote.source[lang]}
                </footer>
              </blockquote>
            </div>
          </section>
        ) : null}

        {/* Next project */}
        <section data-theme="paper" aria-label={t.projectsPage.next} className="pb-[var(--section-y)]">
          <div className="container-x">
            <TLink href={href(lang, "projects", next.slug[lang])} transitionLabel={next.name} className="group grid-12 items-end gap-y-6 border-t border-[var(--line)] pt-10">
              <div className="col-span-4 lg:col-span-5">
                <p className="t-label">{t.projectsPage.next}</p>
                <p className="t-l mt-3">{next.name}</p>
                <p className="t-body-l mt-1 text-[var(--fg-2)]">{next.address[lang]}</p>
              </div>
              <ProjectImage
                p={next}
                lang={lang}
                label={label}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="col-span-4 aspect-[16/10] lg:col-span-6 lg:col-start-7"
                imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-enter)] group-hover:scale-[1.04]"
              />
            </TLink>
          </div>
        </section>
      </article>
    </RevealScope>
  );
}
