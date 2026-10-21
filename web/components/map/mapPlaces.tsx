import { TLink } from "@/components/layout/PageTransition";
import { Mark } from "@/components/marks/Mark";
import { projects } from "@/content/projects";
import { company } from "@/content/site";
import type { Dictionary } from "@/content/dictionaries/it";
import { href, type Locale } from "@/lib/i18n";
import type { MapPlace } from "./ItalyMap";

/** The two offices and the published operations, as map places with their list entries. */
export function mapPlaces(lang: Locale, t: Dictionary): MapPlace[] {
  const m = t.projectsPage.map;
  const offices: MapPlace[] = company.offices.map((o) => ({
    key: o.key,
    lat: o.coords.lat,
    lon: o.coords.lon,
    kind: "office",
    item: (
      <div>
        <span className="t-body-l flex items-center gap-2.5 text-[var(--fg)]">
          <Mark />
          {o.city}
        </span>
        <span className="t-label">
          {m.office} · {o.street}
        </span>
      </div>
    ),
  }));
  const operations: MapPlace[] = projects.map((p) => ({
    key: p.slug.it,
    lat: p.coords.lat,
    lon: p.coords.lon,
    kind: "project",
    item: (
      <TLink href={href(lang, "projects", p.slug[lang])} transitionLabel={p.name} className="group">
        <span className="t-body-l flex items-center justify-between gap-4 text-[var(--fg)]">
          <span className="flex items-center gap-2.5">
            <Mark kind="outline" />
            <span className="vp-ulink">{p.name}</span>
          </span>
          <span aria-hidden="true" className="vp-go">
            →
          </span>
        </span>
        <span className="t-label">
          {p.place[lang]} · {p.status[lang]} · <span className="t-num">{p.year}</span>
        </span>
      </TLink>
    ),
  }));
  return [...offices, ...operations];
}
