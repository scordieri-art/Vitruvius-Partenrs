import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { TLink } from "@/components/layout/PageTransition";
import { Hero } from "@/components/home/Hero";
import { Filiera, type Step } from "@/components/home/Filiera";
import { Counters } from "@/components/home/Counters";
import { OperationStack } from "@/components/home/OperationStack";
import { ContactBand } from "@/components/home/ContactBand";
import { ProjectImage } from "@/components/cases/ProjectImage";
import { Mark } from "@/components/marks/Mark";
import { Cta } from "@/components/ui/Cta";
import { MapSlab } from "@/components/map/ItalyMap";
import { mapPins } from "@/components/map/mapPlaces";
import { lowRes, projects } from "@/content/projects";
import { getDictionary, liveLink } from "@/lib/content";
import { href, type Locale } from "@/lib/i18n";
import { alternates } from "@/lib/seo";

/** Indicative colour photographs, one series in one treatment (public/images/home/CREDITS.md). */
const IMG = {
  hero: "/images/home/home-hero-balconies.jpg",
  vp: "/images/home/home-vp-rooftops.jpg",
  construction: "/images/home/home-construction-scaffolding.jpg",
  living: "/images/home/home-living-sunlit.jpg",
  contact: "/images/home/home-contact-palazzo.jpg",
} as const;

/** Outlets that covered the group's operations, in the order of the operations. Names only, no logos. */
const PRESS = ["Il Secolo XIX", "La Stampa", "Agi", "Affaritaliani.it", "Il Corriere Nazionale"];

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDictionary();
  return {
    title: { absolute: `${t.meta.siteName} — ${t.home.hero.title.join(" ")}` },
    description: t.meta.description,
    alternates: alternates(lang, "home"),
  };
}

/** "project:<it slug>" → the case page; "about#hash" → a section of the about page. */
const proofHref = (lang: Locale, link: string) => {
  if (!link) return undefined;
  if (link.startsWith("project:")) {
    const p = projects.find((x) => x.slug.it === link.slice(8));
    return p ? href(lang, "projects", p.slug[lang]) : undefined;
  }
  const [, hash] = link.split("#");
  return href(lang, "about", undefined, hash);
};

/**
 * Home: statement → how the group works (three steps, one proof each) → figures and
 * press → projects → contact. Few words, large images, nothing hidden behind a hover.
 */
export default async function HomePage() {
  const { lang, t } = await getDictionary();
  const h = t.home;

  const steps: Step[] = t.group.entities.map((e) => ({
    key: e.key,
    verb: e.verb,
    name: e.name,
    kind: e.kind,
    text: e.text,
    image: IMG[e.key as "vp" | "construction" | "living"],
    href: e.href || href(lang, "about"),
    linkLabel: e.linkLabel,
    external: !!e.href,
    proof: { value: e.proof.value, unit: e.proof.unit, label: e.proof.label, href: proofHref(lang, e.proof.link), linkLabel: e.proof.linkLabel },
  }));

  const places = mapPins(lang);

  const press = PRESS.flatMap((outlet) => {
    for (const p of projects) {
      const s = p.sources.find((x) => x.label === outlet && liveLink(x.url));
      if (s) return [{ outlet, url: liveLink(s.url)!, topic: `${p.name} · ${s.date[lang].replace(/^\D+/, "")}` }];
    }
    return [];
  });

  return (
    <RevealScope>
      <Hero copy={h.hero} image={IMG.hero} />

      {/* How the group works */}
      <section data-theme="paper" aria-labelledby="lines-title" className="pt-[var(--section-y)]">
        <div className="container-x">
          <p className="t-label mb-5" data-reveal="fade">
            {h.lines.label}
          </p>
          <h2 id="lines-title" className="t-l max-w-[20ch] [text-wrap:balance]" data-reveal="lines">
            {h.lines.title}
          </h2>
        </div>
        <Filiera steps={steps} externalNote={t.ui.externalNew} label={h.lines.title} />
      </section>

      {/* Figures and press */}
      <section data-theme="navy" aria-labelledby="numbers-title" className="py-[clamp(4.5rem,9vw,8rem)]">
        <div className="container-x grid-12 items-center gap-y-14">
          <div className="col-span-4 lg:order-2 lg:col-span-7 lg:col-start-6">
            <h2 id="numbers-title" className="t-label mb-8" data-reveal="fade">
              {h.numbers.label}
            </h2>
            <Counters figures={t.group.figures} locale={lang === "it" ? "it-IT" : "en-GB"} paired />
            <p className="t-label mt-10">
              {h.numbers.note} ·{" "}
              <TLink href={href(lang, "about", undefined, "credentials")} className="vp-ulink">
                {h.numbers.source}
              </TLink>
            </p>
          </div>
          {/* the scale of the group: offices and published operations on the navy slab */}
          <div className="col-span-4 lg:order-1 lg:col-span-5">
            <MapSlab places={places} width={440} className="max-w-[19rem] lg:mx-0 lg:max-w-[28rem]" />
            <div className="mt-6 flex justify-center lg:justify-start">
              <Cta href={href(lang, "projects", undefined, "map-title")} transitionLabel={t.meta.titles.projects}>
                {t.projectsPage.map.label}
              </Cta>
            </div>
          </div>
        </div>

        <div className="container-x">
          <div className="mt-[clamp(3.5rem,7vw,6rem)]">
            <h2 className="t-label mb-5">{h.press.label}</h2>
            <ul className="vp-press">
              {press.map((x) => (
                <li key={x.outlet}>
                  <a href={x.url} target="_blank" rel="noopener noreferrer" className="vp-press__link group">
                    <span className="t-s leading-tight">
                      <span className="vp-ulink">{x.outlet}</span>
                    </span>
                    <span className="t-label sr-only lg:not-sr-only">
                      {x.topic}
                      <span aria-hidden="true">{"\u00a0"}↗</span>
                      <span className="sr-only"> ({t.ui.externalNew})</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Projects: a stack of dossiers */}
      <section id="progetti" data-theme="paper" aria-labelledby="projects-title" className="py-[var(--section-y)]">
        <div className="container-x mb-[clamp(2.5rem,5vw,4.5rem)] flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="t-label mb-5" data-reveal="fade">
              {h.projects.label}
            </p>
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
              <div className="vp-op__pic">
                <ProjectImage
                  p={p}
                  lang={lang}
                  label={h.projects.placeholder}
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  className="h-full"
                  imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-enter)] group-hover:scale-[1.03]"
                />
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

      <ContactBand label={h.contact.label} title={h.contact.title} cta={h.contact.cta} href={`${href(lang, "contact")}?topic=property#write`} image={IMG.contact} vivid />
    </RevealScope>
  );
}
