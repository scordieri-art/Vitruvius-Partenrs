import { TLink } from "@/components/layout/PageTransition";
import { Mark } from "@/components/marks/Mark";
import { projects } from "@/content/projects";
import { company } from "@/content/site";
import type { Dictionary } from "@/content/dictionaries/it";
import { href, type Locale } from "@/lib/i18n";
import type { MapPin, MapPlace } from "./ItalyMap";

/** The two offices and the published operations as pins: where, what, and the short name on the flag. */
export function mapPins(lang: Locale): MapPin[] {
  return [
    ...company.offices.map((o) => ({ key: o.key, lat: o.coords.lat, lon: o.coords.lon, kind: "office" as const, label: o.city, area: o.area })),
    ...projects.map((p) => ({
      key: p.slug.it,
      lat: p.coords.lat,
      lon: p.coords.lon,
      kind: "project" as const,
      // the town, without the province: "Airuno (LC)" → "Airuno"
      label: p.place[lang].replace(/\s*\(.*\)$/, ""),
      note: p.year,
      area: p.area,
    })),
  ];
}

/** The same places with their list entries. */
export function mapPlaces(lang: Locale, t: Dictionary): MapPlace[] {
  const m = t.projectsPage.map;
  const pins = Object.fromEntries(mapPins(lang).map((p) => [p.key, p]));
  const offices: MapPlace[] = company.offices.map((o) => ({
    ...pins[o.key],
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
    ...pins[p.slug.it],
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
