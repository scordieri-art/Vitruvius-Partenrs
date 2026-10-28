import { TLink } from "@/components/layout/PageTransition";
import { Mark } from "@/components/marks/Mark";
import { projects } from "@/content/projects";
import { company } from "@/content/site";
import type { Dictionary } from "@/content/dictionaries/it";
import { href, type Locale } from "@/lib/i18n";
import type { MapPin, MapPlace } from "./ItalyMap";
import type { ChapterStep } from "./WhereChapter";

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

/**
 * The stops of the home chapter (WhereChapter): Italy, the two offices, each operation, then
 * every place with its list. Captions say only what the site already publishes.
 */
export function chapterSteps(lang: Locale, t: Dictionary): ChapterStep[] {
  const m = t.projectsPage.map;
  const c = m.chapter;
  return [
    {
      key: "italy",
      focus: [],
      rail: c.italy,
      caption: (
        <div className="vp-gl__card">
          <p className="t-body-l">{m.caption}</p>
        </div>
      ),
    },
    {
      key: "offices",
      focus: company.offices.map((o) => o.key),
      rail: c.offices,
      caption: (
        <div className="vp-gl__card">
          <p className="t-label">{c.offices}</p>
          <ul className="vp-gl__places">
            {company.offices.map((o) => (
              <li key={o.key}>
                <span className="t-m flex items-center gap-3">
                  <Mark />
                  {o.city}
                </span>
                <span className="t-label mt-1 block">
                  {m.office} · {o.street}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    ...projects.map((p) => ({
      key: p.slug.it,
      focus: [p.slug.it],
      rail: p.place[lang].replace(/\s*\(.*\)$/, ""),
      caption: (
        <div className="vp-gl__card">
          <p className="t-label flex items-center gap-2">
            <Mark kind="outline" />
            {p.status[lang]} · <span className="t-num">{p.year}</span>
          </p>
          <h3 className="t-m mt-4">{p.name}</h3>
          <p className="t-body mt-1 text-[var(--fg-2)]">{p.address[lang]}</p>
          <p className="t-body mt-5">{p.summary[lang]}</p>
          <TLink href={href(lang, "projects", p.slug[lang])} transitionLabel={p.name} className="vp-ulink t-small mt-6 inline-block">
            {c.project} →
          </TLink>
        </div>
      ),
    })),
    {
      key: "all",
      focus: mapPins(lang).map((p) => p.key),
      rail: c.all,
      caption: (
        <div className="vp-gl__card vp-gl__card--list">
          <p className="t-label">{c.all}</p>
          <ol className="vp-map__list mt-4">
            {mapPlaces(lang, t).map((p) => (
              <li key={p.key} className="vp-map__item" data-k={p.key} data-kind={p.kind}>
                {p.item}
              </li>
            ))}
          </ol>
        </div>
      ),
    },
  ];
}
