import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { ContactBand } from "@/components/home/ContactBand";
import { TLink } from "@/components/layout/PageTransition";
import { ProjectImage } from "@/components/cases/ProjectImage";
import { Mark } from "@/components/marks/Mark";
import { PageHero } from "@/components/ui/PageHero";
import { ItalyMap } from "@/components/map/ItalyMap";
import { mapPlaces } from "@/components/map/mapPlaces";
import { lowRes, projects } from "@/content/projects";
import { getDictionary } from "@/lib/content";
import { href } from "@/lib/i18n";
import { alternates, metaText, ogPath, share } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDictionary();
  return {
    title: t.meta.titles.projects,
    // the operations by name: what someone searching for them types
    description: metaText(`${t.meta.projectsDescription} ${projects.map((p) => `${p.name} (${p.place[lang].replace(/\s*\(.*\)$/, "")})`).join(", ")}.`),
    alternates: alternates(lang, "projects"),
    ...share(lang, ogPath(lang, "projects")),
  };
}

/** Projects: the latest operation large, the others side by side. Image, status, name, place. */
export default async function ProjectsIndex() {
  const { lang, t } = await getDictionary();
  const pp = t.projectsPage;

  return (
    <RevealScope>
      <PageHero label={pp.label} index={pp.count(projects.length)} title={pp.title} lead={pp.lead} />
      <section data-theme="paper" className="pb-[var(--section-y)]">
        <ul className="container-x grid-12 gap-y-[clamp(4rem,8vw,7rem)]">
          {projects.map((p, i) => {
            const first = i === 0;
            // the lead case spans the page; a small published picture sits beside its words instead
            const framed = first && lowRes(p);
            const caseLink = (
              <ProjectImage
                p={p}
                lang={lang}
                label={t.home.projects.placeholder}
                sizes={framed ? `(min-width: 1024px) ${Math.round(p.image!.width * 1.25)}px, 100vw` : first ? "100vw" : "(min-width: 1024px) 50vw, 100vw"}
                priority={first}
                className={framed ? "w-full" : first ? "aspect-[4/5] sm:aspect-[16/9]" : "aspect-[4/5]"}
                style={framed ? { aspectRatio: `${p.image!.width} / ${p.image!.height}` } : undefined}
                imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-enter)] group-hover:scale-[1.03]"
                hoverLabel={t.home.projects.open}
              />
            );
            return (
              <li key={p.slug.it} id={`p-${p.slug[lang]}`} className={first ? "col-span-4 lg:col-span-12" : i === 1 ? "col-span-4 lg:col-span-6" : "col-span-4 lg:col-span-5 lg:col-start-8 lg:mt-[clamp(6rem,14vw,14rem)]"}>
                <TLink href={href(lang, "projects", p.slug[lang])} transitionLabel={p.name} className={`group ${framed ? "grid-12 gap-y-6 lg:items-end" : "block"}`} morph={!lowRes(p)}>
                  <div data-reveal="image" className={framed ? "col-span-4 lg:col-span-7" : undefined} style={framed ? { maxWidth: `${Math.round(p.image!.width * 1.25)}px` } : undefined}>
                    {caseLink}
                  </div>
                  <div className={`${framed ? "col-span-4 lg:col-span-5 lg:col-start-8" : "mt-6"} flex items-start justify-between gap-6`}>
                    <div className="min-w-0">
                      <p className="t-label flex items-center gap-2">
                        <Mark className="text-[var(--fg)]" />
                        {p.status[lang]} · <span className="t-num">{p.year}</span>
                      </p>
                      <h2 className={`${first ? "t-l" : "t-m"} mt-3`}>{p.name}</h2>
                      <p className="t-body-l mt-1 text-[var(--fg-2)]">{p.address[lang]}</p>
                      {framed ? <p className="t-body mt-6 max-w-[40ch]">{p.summary[lang]}</p> : null}
                    </div>
                    <span aria-hidden="true" className="vp-go mt-8">
                      →
                    </span>
                  </div>
                </TLink>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Where the group works: offices and operations on the map, tilted into depth by the scroll */}
      <section data-theme="paper" aria-labelledby="map-title" className="border-t border-[var(--line)] py-[var(--section-y)]">
        <div className="container-x">
          <p className="t-label mb-5" data-reveal="fade">
            {pp.map.label}
          </p>
          <h2 id="map-title" className="t-l mb-[clamp(2.5rem,6vw,5rem)] max-w-[18ch]" data-reveal="lines">
            {pp.map.title}
          </h2>
          <ItalyMap places={mapPlaces(lang, t)} caption={pp.map.caption} label={pp.map.aria} />
        </div>
      </section>
      {/* where the reader is most interested: an offer of a property, with the topic chosen */}
      <ContactBand
        label={t.home.contact.label}
        title={t.home.contact.title}
        cta={t.home.contact.cta}
        href={`${href(lang, "contact")}?topic=property#write`}
        image="/images/home/home-contact-palazzo.jpg"
        vivid
      />
    </RevealScope>
  );
}
