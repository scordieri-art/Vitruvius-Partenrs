import type { CSSProperties, ReactNode } from "react";
import italy from "@/content/geo/italy.json";
import { Mark } from "@/components/marks/Mark";
import { MapStage } from "./MapStage";

/** Same projection as the outline data: equirectangular, km, centred on 42°N 12.5°E. */
const LAT0 = (42 * Math.PI) / 180;
const R = 6371;
const project = (lat: number, lon: number) => [R * (((lon - 12.5) * Math.PI) / 180) * Math.cos(LAT0), R * (((lat - 42) * Math.PI) / 180)];

// SVG space: x east, y south (km). The view frames mainland, Sicily and Sardinia.
const VIEW = { x: -500, y: -580, w: 1010, h: 1185 };
const OUTLINE = (italy.rings as number[][][]).map((ring) => `M${ring.map(([x, y]) => `${x} ${-y}`).join("L")}Z`).join("");
const LAYERS = 6;

export type MapPlace = {
  key: string;
  lat: number;
  lon: number;
  kind: "office" | "project";
  /** the list entry: usually a link to the case, plain text for an office */
  item: ReactNode;
};

/**
 * Italy as a slab in the brand navy, tilted into depth by the scroll, with a standing
 * mark for each place. The list beside it is the readable, accessible version: hovering
 * or focusing an entry lights its mark and dims the others (CSS only, see the rules below).
 * `focus` lights one place permanently (a case page).
 */
export function ItalyMap({ places, caption, label, focus }: { places: MapPlace[]; caption: string; label: string; focus?: string }) {
  const pins = places.map((p) => {
    const [x, y] = project(p.lat, p.lon);
    return { ...p, left: ((x - VIEW.x) / VIEW.w) * 100, top: ((-y - VIEW.y) / VIEW.h) * 100 };
  });
  // one pair of rules per place: its list entry lights its mark
  const rules = pins
    .map((p) => `.vp-map:has(.vp-map__item[data-k="${p.key}"]:is(:hover,:focus-within)) .vp-map__pin[data-k="${p.key}"]{--on:1}`)
    .join("");

  return (
    <figure className="vp-map grid-12 gap-y-10" data-focus={focus ? "" : undefined} aria-label={label}>
      <style>{rules}</style>
      <div className="col-span-4 lg:col-span-7">
        <MapStage>
          {Array.from({ length: LAYERS }, (_, i) => (
            <svg
              key={i}
              className="vp-map__layer"
              viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
              aria-hidden="true"
              focusable="false"
              style={{ "--i": i } as CSSProperties}
            >
              <path d={OUTLINE} />
            </svg>
          ))}
          {pins.map((p) => (
            <span
              key={p.key}
              className="vp-map__pin"
              data-k={p.key}
              data-kind={p.kind}
              style={{ left: `${p.left}%`, top: `${p.top}%`, ...(focus === p.key ? { "--on": 1 } : null) } as CSSProperties}
              aria-hidden="true"
            >
              <span className="vp-map__blade">
                <Mark />
              </span>
            </span>
          ))}
        </MapStage>
      </div>
      <div className="col-span-4 lg:col-span-4 lg:col-start-9 lg:self-center">
        <ol className="vp-map__list">
          {pins.map((p) => (
            <li key={p.key} className="vp-map__item" data-k={p.key} data-kind={p.kind} aria-current={focus === p.key ? "true" : undefined}>
              {p.item}
            </li>
          ))}
        </ol>
        <figcaption className="t-label mt-6">{caption}</figcaption>
      </div>
    </figure>
  );
}
