import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { RevealScope } from "@/components/layout/RevealScope";
import { TLink } from "@/components/layout/PageTransition";
import { Hero } from "@/components/home/Hero";
import { Filiera } from "@/components/home/Filiera";
import { Figures, type Figure } from "@/components/home/Figures";
import { HOME_IMG as IMG, homeSteps } from "@/content/home";
import { OperationStack } from "@/components/home/OperationStack";
import { ContactBand } from "@/components/home/ContactBand";
import { ProjectImage } from "@/components/cases/ProjectImage";
import { Mark } from "@/components/marks/Mark";
import { Cta } from "@/components/ui/Cta";
import { ItalyMap } from "@/components/map/ItalyMap";
import { chapterSteps, mapPins, mapPlaces } from "@/components/map/mapPlaces";
import { WhereChapter } from "@/components/map/WhereChapter";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { declared, production, top200 } from "@/content/evidence";
import { lowRes, projects } from "@/content/projects";
import { getDictionary, liveLink, newsHref } from "@/lib/content";
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
  // the published figures, one at a time: first the documented ones, with their sources (the value
  // of production in its last published year, the two before as context; the place in the Top
  // 200), then what the group declares, the planned last
  const n = h.numbers;
  const [first, second] = production;
  const last = production[production.length - 1];
  const place = top200.points[top200.points.length - 1];
  // an ordinal in letters (English "rd") rides small above the figure, the Italian ° is a digit's own
  const rank = t.group.rank(place.rank);
  const suffix = rank.slice(String(place.rank).length);
  const lettered = /[a-z]/i.test(suffix);
  const cite = (sources: (typeof top200.source)[]) => (
    <>
      {sources.length > 1 ? n.sourceMany : n.sourceOne}:{" "}
      {sources.map((s, i) => (
        <span key={s.news}>
          {i ? " · " : null}
          <TLink href={newsHref(lang, s.news!)} className="vp-ulink">
            {s.label[lang]}
          </TLink>
        </span>
      ))}
    </>
  );
  const said = (d: (typeof declared)[number]) => ({
    value: d.value,
    label: d.label[lang],
    source: n.declared,
    planned: d.kind === "planned",
    tally: { n: parseInt(d.value, 10) },
  });
  const figures: Figure[] = [
    {
      key: "production",
      value: last.display[lang],
      unit: { text: n.productionUnit },
      spoken: n.productionSpoken(last.display[lang]),
      row: n.rows.production,
      label: n.productionLabel(last.year),
      note: n.productionNote(first.display[lang], first.year, second.display[lang], second.year, second.change![lang]),
      // each source once: 2021 and 2022 come from the same release
      source: cite(production.map((p) => p.source).filter((s, i, all) => all.findIndex((x) => x.news === s.news) === i)),
      // a mark for each million, the last one as long as the decimal
      tally: { n: Math.ceil(last.value), part: +(last.value % 1).toFixed(2) || undefined },
    },
    {
      key: "top200",
      value: lettered ? String(place.rank) : rank,
      unit: lettered ? { text: suffix, sup: true } : undefined,
      spoken: n.top200Spoken(place.rank),
      row: n.rows.top200,
      label: n.top200Label(place.year),
      note: t.group.top200Note,
      source: cite([top200.source]),
      tally: { n: top200.of, here: place.rank },
    },
    { key: "sites", row: n.rows.sites, ...said(declared[0]) },
    {
      key: "cities",
      row: n.rows.cities,
      ...said(declared[2]),
      note: (
        <a href="#where-title" className="vp-ulink">
          {n.where} <span aria-hidden="true">↓</span>
        </a>
      ),
    },
    { key: "contracts", row: n.rows.contracts, ...said(declared[1]), note: n.planned },
  ];

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

      {/* Figures, one at a time beside their index, then the press as an index of articles */}
      <section data-theme="paper" aria-labelledby="numbers-title" className="pt-[var(--section-y)]">
        <div className="container-x">
          <div className="mb-[clamp(2.5rem,5vw,4.5rem)] flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <SectionLabel n={2} as="h2" id="numbers-title">
              {n.label}
            </SectionLabel>
            <p className="t-label">
              {n.note} ·{" "}
              <TLink href={href(lang, "about", undefined, "credentials")} className="vp-ulink">
                {n.source}
              </TLink>
            </p>
          </div>
          <Figures figures={figures} legend={n.pick} name="cifre" />
        </div>

        <div className="container-x mt-[clamp(4.5rem,9vw,8rem)]">
          <SectionLabel n={3} as="h2" id="press-title" className="mb-[clamp(1.5rem,3vw,2.5rem)]">
            {h.press.label}
          </SectionLabel>
          <ul className="vp-index" aria-labelledby="press-title">
            {press.map((x) => (
              <li key={x.outlet}>
                <a href={x.url} target="_blank" rel="noopener noreferrer" className="vp-index__row">
                  <span className="vp-index__lead">
                    <Mark kind="outline" className="vp-index__mark" />
                    {x.outlet}
                  </span>
                  {x.title ? (
                    <span className="vp-index__text" lang="it">
                      «{x.title}»
                    </span>
                  ) : null}
                  <span className="vp-index__meta t-label">
                    {x.project} · {x.iso ? <time dateTime={x.iso}>{x.date}</time> : x.date}
                  </span>
                  <span className="vp-index__go" aria-hidden="true">
                    ↗
                  </span>
                  <span className="sr-only"> ({t.ui.externalNew})</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Where the group works: on a desktop a chapter of its own, the camera travelling over the
          model from the offices to each operation (WebGL); elsewhere the model with its list */}
      <section data-theme="navy" aria-labelledby="where-title" className="vp-where mt-[var(--section-y)]">
        <WhereChapter
          pins={mapPins(lang)}
          steps={chapterSteps(lang, t)}
          stopsLabel={t.projectsPage.map.chapter.stops}
          head={
            <>
              <SectionLabel n={4} className="mb-5">
                {t.projectsPage.map.label}
              </SectionLabel>
              <h2 id="where-title" className="t-l max-w-[18ch] [text-wrap:balance]" data-reveal="lines">
                {t.projectsPage.map.title}
              </h2>
            </>
          }
          fallback={
            <div className="container-x mt-[clamp(2.5rem,6vw,5rem)]">
              <ItalyMap places={mapPlaces(lang, t)} caption={t.projectsPage.map.caption} label={t.projectsPage.map.aria} />
            </div>
          }
        />
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
          {/* the last card closes the stack: all the projects, on their page */}
          <TLink href={href(lang, "projects")} transitionLabel={t.meta.titles.projects} className="vp-op vp-op--all group" data-cursor={t.ui.open}>
            <p className="vp-op__tab t-label t-num">
              <span>
                {String(projects.length + 1).padStart(2, "0")} / {String(projects.length + 1).padStart(2, "0")}
              </span>
              <span>{projects.map((p) => p.place[lang].replace(/\s*\(.*\)$/, "")).join(" · ")}</span>
            </p>
            <span className="vp-op__all">
              <Mark kind="outline" className="vp-op__allmark" />
              <span className="vp-op__name">{h.projects.cta}</span>
              <span className="vp-op__go t-small">
                {h.projects.lead} <span aria-hidden="true" className="vp-go">→</span>
              </span>
            </span>
          </TLink>
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
