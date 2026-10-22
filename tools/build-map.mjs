// Builds the site map (public/map/italia.svg, content/geo/map.json) from Natural Earth (public domain).
// usage: node tools/build-map.mjs <node_modules parent dir> <natural-earth geojson dir> <out dir>
//   needs: world-atlas@2.0.2, topojson-server@3, topojson-client@3, topojson-simplify@3 (npm) and, from
//   github.com/nvkelso/natural-earth-vector v5.1.2 geojson/: ne_10m_admin_1_states_provinces, ne_10m_lakes,
//   ne_10m_lakes_europe. Writes <out>/italia.svg (to web/public/map/) and <out>/map.json (to web/content/geo/).
import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";

const [G, NE, OUT] = process.argv.slice(2);
const require = createRequire(G + "/package.json");
const { topology } = require("topojson-server");
const { feature, mesh, merge } = require("topojson-client");
const { presimplify, simplify } = require("topojson-simplify");

// equirectangular, km, centred on 42°N 12.5°E (same as the site's places)
const LAT0 = (42 * Math.PI) / 180, R = 6371;
const proj = ([lon, lat]) => [R * ((lon - 12.5) * Math.PI) / 180 * Math.cos(LAT0), R * ((lat - 42) * Math.PI) / 180];
// the sheet: a little wider than Italy, so the neighbours frame it
const VIEW = { x0: -560, x1: 600, y0: -640, y1: 620 }; // y north-up here

const projectGeom = (g) => {
  const ring = (r) => r.map(proj);
  if (g.type === "Polygon") return { type: "Polygon", coordinates: g.coordinates.map(ring) };
  if (g.type === "MultiPolygon") return { type: "MultiPolygon", coordinates: g.coordinates.map((p) => p.map(ring)) };
  return g;
};
const bboxOf = (g) => {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const walk = (c) => (typeof c[0] === "number" ? ((x0 = Math.min(x0, c[0])), (x1 = Math.max(x1, c[0])), (y0 = Math.min(y0, c[1])), (y1 = Math.max(y1, c[1]))) : c.forEach(walk));
  walk(g.coordinates);
  return { x0, x1, y0, y1 };
};
const intersects = (b) => b.x1 > VIEW.x0 && b.x0 < VIEW.x1 && b.y1 > VIEW.y0 && b.y0 < VIEW.y1;

// countries (world-atlas 10m is Natural Earth 1:10m)
const wa = JSON.parse(readFileSync(G + "/node_modules/world-atlas/countries-10m.json"));
const countries = feature(wa, wa.objects.countries).features;
const italy = countries.find((f) => f.properties.name === "Italy");
// San Marino and the Vatican sit inside Italy: drawn as part of it, not as holes
const neighbours = countries.filter((f) => f !== italy && f.geometry && !["San Marino", "Vatican"].includes(f.properties.name) && intersects(bboxOf(projectGeom(f.geometry))));
console.log("neighbours:", neighbours.map((f) => f.properties.name).join(", "));

// Italian provinces, tagged with their region, for the internal region borders
const adm = JSON.parse(readFileSync(NE + "/ne_10m_admin_1_states_provinces.geojson"));
const provinces = adm.features.filter((f) => f.properties.iso_a2 === "IT").map((f) => ({ type: "Feature", properties: { region: f.properties.region }, geometry: projectGeom(f.geometry) }));

// lakes over 40 km² inside the sheet
const lk = { features: [...JSON.parse(readFileSync(NE + "/ne_10m_lakes.geojson")).features, ...JSON.parse(readFileSync(NE + "/ne_10m_lakes_europe.geojson")).features] };
const area = (r) => Math.abs(r.reduce((s, p, i) => s + (i ? r[i - 1][0] * p[1] - p[0] * r[i - 1][1] : 0), 0) / 2);
const lakes = lk.features
  .filter((f) => f.geometry)
  .map((f) => ({ type: "Feature", properties: { name: f.properties.name }, geometry: projectGeom(f.geometry) }))
  .filter((f) => intersects(bboxOf(f.geometry)))
  .filter((f) => {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    return polys.some((p) => area(p[0]) > 40);
  });
console.log("lakes:", lakes.map((f) => f.properties.name).join(", "));

const fc = (features) => ({ type: "FeatureCollection", features });
let topo = topology(
  {
    italy: fc([{ type: "Feature", properties: {}, geometry: projectGeom(italy.geometry) }]),
    provinces: fc(provinces),
    lakes: fc(lakes),
  },
  1e6,
);
topo = presimplify(topo); // planar: triangle areas in km²
topo = simplify(topo, Number(process.env.MIN_AREA ?? 1.2));
// the neighbours only frame Italy: coarser, in a topology of their own
let topoN = topology({ neighbours: fc(neighbours.map((f) => ({ type: "Feature", properties: { name: f.properties.name }, geometry: projectGeom(f.geometry) }))) }, 1e6);
topoN = simplify(presimplify(topoN), Number(process.env.MIN_AREA_N ?? 8));

// clip a ring to the sheet (Sutherland–Hodgman), so far coasts cost nothing
const clip = (ring) => {
  const edges = [
    (p) => p[0] >= VIEW.x0, (p) => p[0] <= VIEW.x1, (p) => p[1] >= VIEW.y0, (p) => p[1] <= VIEW.y1,
  ];
  const cut = [
    (a, b) => [VIEW.x0, a[1] + ((b[1] - a[1]) * (VIEW.x0 - a[0])) / (b[0] - a[0])],
    (a, b) => [VIEW.x1, a[1] + ((b[1] - a[1]) * (VIEW.x1 - a[0])) / (b[0] - a[0])],
    (a, b) => [a[0] + ((b[0] - a[0]) * (VIEW.y0 - a[1])) / (b[1] - a[1]), VIEW.y0],
    (a, b) => [a[0] + ((b[0] - a[0]) * (VIEW.y1 - a[1])) / (b[1] - a[1]), VIEW.y1],
  ];
  let out = ring;
  for (let e = 0; e < 4; e++) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const a = inp[(i + inp.length - 1) % inp.length], b = inp[i];
      const ina = edges[e](a), inb = edges[e](b);
      if (inb) { if (!ina) out.push(cut[e](a, b)); out.push(b); }
      else if (ina) out.push(cut[e](a, b));
    }
    if (!out.length) break;
  }
  return out;
};
const r1 = (n) => Math.round(n * 10) / 10;
// SVG y grows south
const ringPath = (r) => (r.length < 3 ? "" : `M${r.map(([x, y]) => `${r1(x)} ${r1(-y)}`).join("L")}Z`);
const polyPaths = (geom, doClip, minArea = 25) => {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
  // outer rings only: lakes are drawn on top, enclaves belong to the land
  return polys
    .map((p) => (doClip ? clip(p[0]) : p[0]))
    .filter((r) => r.length >= 3 && area(r) > minArea)
    .map(ringPath)
    .join("");
};
const linePath = (geom) => geom.coordinates.map((l) => `M${l.map(([x, y]) => `${r1(x)} ${r1(-y)}`).join("L")}`).join("");

const it = feature(topo, topo.objects.italy).features[0].geometry;
const nb = feature(topoN, topoN.objects.neighbours).features.map((f) => polyPaths(f.geometry, true, 120)).join("");
const lakesPath = feature(topo, topo.objects.lakes).features.map((f) => polyPaths(f.geometry, false)).join("");
const regions = linePath(mesh(topo, topo.objects.provinces, (a, b) => a !== b && a.properties.region !== b.properties.region));

// each region as a filled shape, so the map can raise the ones where the group works
const slug = (r) => r.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const regionNames = [...new Set(topo.objects.provinces.geometries.map((g) => g.properties.region))].sort();
const regionShapes = Object.fromEntries(
  regionNames.map((r) => [slug(r), polyPaths(merge(topo, topo.objects.provinces.geometries.filter((g) => g.properties.region === r)), false)]),
);
// lakes by the region that holds their centre, so a raised region carries its own lakes
const inRing = ([x, y], r) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > y !== r[j][1] > y && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  return c;
};
const regionOf = (pt) => {
  for (const f of feature(topo, topo.objects.provinces).features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    if (polys.some((p) => inRing(pt, p[0]))) return slug(f.properties.region);
  }
  return null;
};
const lakesByRegion = {};
for (const f of feature(topo, topo.objects.lakes).features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const ring = polys.map((p) => p[0]).sort((a, b) => area(b) - area(a))[0];
  const c = ring.reduce((m, p) => [m[0] + p[0] / ring.length, m[1] + p[1] / ring.length], [0, 0]);
  const r = regionOf(c);
  if (r) (lakesByRegion[r] ??= []).push(polyPaths(f.geometry, false));
}
console.log("lakes by region:", Object.fromEntries(Object.entries(lakesByRegion).map(([k, v]) => [k, v.length])));

const cities = { Torino: [7.686, 45.07], Milano: [9.19, 45.464], Venezia: [12.316, 45.44], Genova: [8.946, 44.405], Bologna: [11.343, 44.494], Firenze: [11.255, 43.77], Roma: [12.496, 41.903], Napoli: [14.268, 40.852], Bari: [16.872, 41.117], Palermo: [13.361, 38.116], Cagliari: [9.11, 39.223] };
// Venezia sits on the lagoon, outside the simplified coast: its region is given
const cityRegion = (k, v) => regionOf(proj(v)) ?? { Venezia: "veneto" }[k] ?? null;
const view = { x: VIEW.x0, y: -VIEW.y1, w: VIEW.x1 - VIEW.x0, h: VIEW.y1 - VIEW.y0 };
const groups = {
  italy: polyPaths(it, false),
  neighbours: nb,
  lakes: lakesPath,
  regions,
  ...Object.fromEntries(Object.entries(regionShapes).map(([k, d]) => [`r-${k}`, d])),
  ...Object.fromEntries(Object.entries(lakesByRegion).map(([k, d]) => [`lakes-${k}`, d.join("")])),
};
// one static file, cached by the browser and referenced with <use href="/map/italia.svg#italy">;
// fills and strokes are left unset so each <use> styles its copy
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.x} ${view.y} ${view.w} ${view.h}">` +
  `<!-- ${"Natural Earth 1:10m, public domain. Generated by tools/build-map.mjs: equirectangular km around 42N 12.5E, y south."} -->` +
  Object.entries(groups).map(([id, d]) => `<g id="${id}"><path d="${d}"${id === "regions" ? ' fill="none"' : ""} vector-effect="non-scaling-stroke"/></g>`).join("") +
  `</svg>`;
writeFileSync(OUT + "/italia.svg", svg);
writeFileSync(
  OUT + "/map.json",
  JSON.stringify({
    source: "Natural Earth 1:10m (public domain); see tools/build-map.mjs",
    view,
    regions: Object.keys(regionShapes),
    cities: Object.fromEntries(Object.entries(cities).map(([k, v]) => { const [x, y] = proj(v); return [k, [r1(x), r1(-y), cityRegion(k, v)]]; })),
  }),
);
const pts = (d) => (d.match(/[ML]/g) || []).length;
console.log("points", Object.fromEntries(Object.entries(groups).map(([k, d]) => [k, pts(d)])), "| svg bytes", svg.length);
