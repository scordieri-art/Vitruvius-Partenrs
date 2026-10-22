import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { TLink } from "@/components/layout/PageTransition";
import { Hero } from "@/components/home/Hero";
import { GroupChain, type Step } from "@/components/home/GroupChain";
import { Counters } from "@/components/home/Counters";
import { ProjectRail } from "@/components/home/ProjectRail";
import { ContactBand } from "@/components/home/ContactBand";
import { ProjectImage } from "@/components/cases/ProjectImage";
import { Mark } from "@/components/marks/Mark";
import { Cta } from "@/components/ui/Cta";
import { MapSlab } from "@/components/map/ItalyMap";
import { company } from "@/content/site";
import { projects } from "@/content/projects";
import { getDictionary } from "@/lib/content";
import { href, type Locale } from "@/lib/i18n";
import { alternates } from "@/lib/seo";

const IMG = {
  hero: "/images/placeholder/facade-bw-tower-corner-03.jpg",
  vp: "/images/placeholder/plans-pencil-drawing-04.jpg",
  construction: "/images/placeholder/construction-tower-crane-01.jpg",
  living: "/images/placeholder/interior-loft-linen-curtains-03.jpg",
  contact: "/images/placeholder/facade-white-shutters-rhythm-05.jpg",
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

  const places = [
    ...company.offices.map((o) => ({ key: o.key, lat: o.coords.lat, lon: o.coords.lon, kind: "office" as const })),
    ...projects.map((p) => ({ key: p.slug.it, lat: p.coords.lat, lon: p.coords.lon, kind: "project" as const })),
  ];

  const press = PRESS.flatMap((outlet) => {
    for (const p of projects) {
      const s = p.sources.find((x) => x.label === outlet);
      if (s) return [{ outlet, url: s.url, topic: `${p.name} · ${s.date[lang].replace(/^\D+/, "")}` }];
    }
    return [];
  });

  return (
    <RevealScope>
      <Hero copy={h.hero} image={IMG.hero} />

      {/* How the group works */}
      <section data-theme="paper" aria-labelledby="lines-title" className="pt-[var(--section-y)] pb-[clamp(4.5rem,9vw,8rem)]">
        <div className="container-x mb-[clamp(2.5rem,5vw,4.5rem)]">
          <p className="t-label mb-5" data-reveal="fade">
            {h.lines.label}
          </p>
          <h2 id="lines-title" className="t-l max-w-[16ch]" data-reveal="lines">
            {h.lines.title}
          </h2>
        </div>
        <GroupChain steps={steps} externalNote={t.ui.externalNew} label={h.lines.title} />
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
            <MapSlab places={places} className="max-w-[19rem] lg:mx-0 lg:max-w-[28rem]" />
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

      {/* Projects */}
      <section id="progetti" data-theme="paper" aria-labelledby="projects-title" className="py-[var(--section-y)]">
        <ProjectRail
          intro={
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="t-label mb-5 flex justify-between gap-6" data-reveal="fade">
                  <span>{h.projects.label}</span>
                  <span className="lg:hidden" aria-hidden="true">
                    {h.projects.swipe} →
                  </span>
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
          }
        >
          {projects.map((p) => (
            <TLink key={p.slug.it} href={href(lang, "projects", p.slug[lang])} transitionLabel={p.name} className="vp-card group block" morph>
              <ProjectImage
                p={p}
                lang={lang}
                label={h.projects.placeholder}
                sizes="(min-width: 1024px) 31vw, 78vw"
                className="aspect-[4/3] lg:aspect-[4/5]"
                imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-enter)] group-hover:scale-[1.03]"
                hoverLabel={h.projects.open}
              />
              <div className="mt-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="t-label flex items-center gap-2">
                    <Mark className="text-[var(--fg)]" />
                    {p.status[lang]} · <span className="t-num">{p.year}</span>
                  </p>
                  <h3 className="t-m mt-3">{p.name}</h3>
                  <p className="t-body mt-1 text-[var(--fg-2)]">{p.place[lang]}</p>
                </div>
                <span aria-hidden="true" className="vp-go mt-8">
                  →
                </span>
              </div>
            </TLink>
          ))}
        </ProjectRail>
      </section>

      <ContactBand label={h.contact.label} title={h.contact.title} cta={h.contact.cta} href={`${href(lang, "contact")}?topic=property#write`} image={IMG.contact} />
    </RevealScope>
  );
}
