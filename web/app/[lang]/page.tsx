import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { RevealScope } from "@/components/layout/RevealScope";
import { TLink } from "@/components/layout/PageTransition";
import { Hero } from "@/components/home/Hero";
import { Filiera } from "@/components/home/Filiera";
import { HOME_IMG as IMG, homeSteps } from "@/content/home";
import { Counters } from "@/components/home/Counters";
import { OperationStack } from "@/components/home/OperationStack";
import { ContactBand } from "@/components/home/ContactBand";
import { ProjectImage } from "@/components/cases/ProjectImage";
import { Mark } from "@/components/marks/Mark";
import { Cta } from "@/components/ui/Cta";
import { ItalyMap } from "@/components/map/ItalyMap";
import { mapPlaces } from "@/components/map/mapPlaces";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { lowRes, projects } from "@/content/projects";
import { getDictionary, liveLink } from "@/lib/content";
import { href } from "@/lib/i18n";
import { alternates } from "@/lib/seo";


/** Outlets that covered the group's operations. Names only, no logos. */
const PRESS = ["Il Secolo XIX", "La Stampa", "Agi", "Affaritaliani.it", "Il Corriere Nazionale"];

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDictionary();
  return {
    title: { absolute: `${t.meta.siteName} — ${t.home.hero.title.join(" ")}` },
    description: t.meta.description,
    alternates: alternates(lang, "home"),
  };
}


/**
 * Home: statement → how the group works (three steps, one proof each) → figures and
 * press → projects → contact. Few words, large images, nothing hidden behind a hover.
 */
export default async function HomePage() {
  const { lang, t } = await getDictionary();
  const h = t.home;

  const steps = homeSteps(lang);

  // the press, newest first: the outlet, its headline as published, the operation and the date
  const press = PRESS.flatMap((outlet) => {
    for (const p of projects) {
      const s = p.sources.find((x) => x.label === outlet && liveLink(x.url));
      if (s) return [{ outlet, url: liveLink(s.url)!, title: s.title, iso: s.iso ?? "", date: s.date[lang], project: p.name }];
    }
    return [];
  }).sort((a, b) => b.iso.localeCompare(a.iso));

  return (
    <RevealScope>
      <Hero copy={h.hero} image={IMG.hero} propose={{ label: h.contact.cta, href: `${href(lang, "contact")}?topic=property#write` }} />

      {/* How the group works */}
      <section data-theme="paper" aria-labelledby="lines-title" className="pt-[var(--section-y)]">
        <div className="container-x">
          <SectionLabel n={1} className="mb-5">
            {h.lines.label}
          </SectionLabel>
          <h2 id="lines-title" className="t-l max-w-[20ch] [text-wrap:balance]" data-reveal="lines">
            {h.lines.title}
          </h2>
        </div>
        <Filiera steps={steps} externalNote={t.ui.externalNew} label={h.lines.title} />
      </section>

      {/* Figures, between hairlines, then the press as an index of articles */}
      <section data-theme="paper" aria-labelledby="numbers-title" className="pt-[var(--section-y)]">
        <div className="container-x">
          <div className="mb-[clamp(2rem,4vw,3.5rem)] flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <SectionLabel n={2} as="h2" id="numbers-title">
              {h.numbers.label}
            </SectionLabel>
            <p className="t-label">
              {h.numbers.note} ·{" "}
              <TLink href={href(lang, "about", undefined, "credentials")} className="vp-ulink">
                {h.numbers.source}
              </TLink>
            </p>
          </div>
          <Counters figures={t.group.figures} locale={lang === "it" ? "it-IT" : "en-GB"} />
        </div>

        <div className="container-x mt-[clamp(4.5rem,9vw,8rem)]">
          <SectionLabel n={3} as="h2" id="press-title" className="mb-[clamp(1.5rem,3vw,2.5rem)]">
            {h.press.label}
          </SectionLabel>
          <ul className="vp-pressrows" aria-labelledby="press-title">
            {press.map((x) => (
              <li key={x.outlet}>
                <a href={x.url} target="_blank" rel="noopener noreferrer" className="vp-pressrow">
                  <span className="vp-pressrow__outlet">
                    <Mark kind="outline" className="vp-pressrow__mark" />
                    {x.outlet}
                  </span>
                  {x.title ? (
                    <span className="vp-pressrow__title" lang="it">
                      «{x.title}»
                    </span>
                  ) : null}
                  <span className="vp-pressrow__meta t-label">
                    {x.project} · {x.iso ? <time dateTime={x.iso}>{x.date}</time> : x.date}
                  </span>
                  <span className="vp-pressrow__go" aria-hidden="true">
                    ↗
                  </span>
                  <span className="sr-only"> ({t.ui.externalNew})</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Where the group works: the offices and the operations on the model, with their list */}
      <section data-theme="navy" aria-labelledby="where-title" className="vp-where mt-[var(--section-y)] py-[var(--section-y)]">
        <div className="container-x">
          <SectionLabel n={4} className="mb-5">
            {t.projectsPage.map.label}
          </SectionLabel>
          <h2 id="where-title" className="t-l max-w-[18ch] [text-wrap:balance]" data-reveal="lines">
            {t.projectsPage.map.title}
          </h2>
          <div className="mt-[clamp(2.5rem,6vw,5rem)]">
            <ItalyMap places={mapPlaces(lang, t)} caption={t.projectsPage.map.caption} label={t.projectsPage.map.aria} />
          </div>
        </div>
      </section>

      {/* Projects: a stack of dossiers */}
      <section id="progetti" data-theme="paper" aria-labelledby="projects-title" className="py-[var(--section-y)]">
        <div className="container-x mb-[clamp(2.5rem,5vw,4.5rem)] flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <SectionLabel n={5} className="mb-5">
              {h.projects.label}
            </SectionLabel>
            <h2 id="projects-title" className="t-l max-w-[14ch]" data-reveal="lines">
              {h.projects.title}
            </h2>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end" data-reveal="fade">
            <p className="t-body-l hidden text-[var(--fg-2)] lg:block">{h.projects.lead}</p>
            <Cta href={href(lang, "projects")} transitionLabel={t.meta.titles.projects}>
              {h.projects.cta}
            </Cta>
          </div>
        </div>
        <OperationStack label={h.projects.title}>
          {projects.map((p, i) => (
            <TLink
              key={p.slug.it}
              href={href(lang, "projects", p.slug[lang])}
              transitionLabel={p.name}
              className="vp-op group"
              morph={!lowRes(p)}
              data-theme="navy"
            >
              {/* the tab: what stays in view when the next dossier covers this one */}
              <p className="vp-op__tab t-label t-num">
                <span>
                  {String(i + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
                  <span className="vp-op__tabname" aria-hidden="true">
                    {" "}
                    · {p.name}
                  </span>
                </span>
                <span>
                  {p.place[lang]} · {p.year}
                </span>
              </p>
              <div className="vp-op__pic" data-small={lowRes(p) ? "" : undefined} data-cursor={t.ui.open}>
                {/* a picture published small is shown at its own size, never stretched: a blurred copy fills the rest */}
                {lowRes(p) && p.image ? (
                  <span className="vp-op__backdrop" aria-hidden="true">
                    <Image src={p.image.src} alt="" fill sizes="20vw" className="object-cover" />
                  </span>
                ) : null}
                <div
                  className="vp-op__frame"
                  style={lowRes(p) && p.image ? ({ "--w": `${p.image.width}px`, "--ar": `${p.image.width} / ${p.image.height}` } as CSSProperties) : undefined}
                >
                  <ProjectImage
                    p={p}
                    lang={lang}
                    label={h.projects.placeholder}
                    sizes="(min-width: 1024px) 46vw, 92vw"
                    className="h-full"
                    imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-enter)] group-hover:scale-[1.03]"
                  />
                </div>
              </div>
              <div className="vp-op__body">
                <h3 className="vp-op__name">{p.name}</h3>
                <p className="vp-op__role t-body-l">{p.role[lang]}</p>
                {p.figures.length ? (
                  <dl className="vp-op__figs">
                    {p.figures.slice(0, 2).map((f) => (
                      <div key={f.label[lang]}>
                        <dt className="t-small vp-op__figlabel">{f.label[lang]}</dt>
                        <dd className="flex items-baseline gap-2">
                          <Mark kind={f.kind === "documented" ? "solid" : "outline"} />
                          <span className="vp-op__fig t-num">{f.value}</span>
                          <span className="t-small">{f.unit[lang]}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : p.quote ? (
                  <blockquote className="vp-op__quote">
                    <p>“{p.quote.text[lang]}”</p>
                    <footer className="t-small mt-2 vp-op__figlabel">
                      {p.quote.author}, {p.quote.role[lang]}
                    </footer>
                  </blockquote>
                ) : null}
                {/* where the operation stands: done phases solid, the next ones outlined */}
                <ol className="vp-op__stages" aria-label={t.cases.stages}>
                  {p.stages.map((st) => (
                    <li key={st.label[lang]} data-done={st.done ? "" : undefined}>
                      <Mark kind={st.done ? "solid" : "outline"} />
                      <span className="t-small">{st.label[lang]}</span>
                      <span className="t-label t-num">{st.when[lang]}</span>
                    </li>
                  ))}
                </ol>
                <p className="vp-op__go t-small">
                  {h.projects.open} <span aria-hidden="true" className="vp-go">→</span>
                </p>
              </div>
            </TLink>
          ))}
        </OperationStack>
      </section>

      <ContactBand
        label={h.contact.label}
        title={h.contact.title}
        cta={h.contact.cta}
        href={`${href(lang, "contact")}?topic=property#write`}
        write={{ label: h.contact.write, href: `${href(lang, "contact")}#write` }}
        image={IMG.contact}
        vivid
        n={6}
      />
    </RevealScope>
  );
}
