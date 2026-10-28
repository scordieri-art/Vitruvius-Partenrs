import map from "@/content/geo/map.json";

/** The sheet of public/map/italia.svg, km: equirectangular around 42°N 12.5°E, y south. */
export const SHEET = map.view;
const LAT0 = (42 * Math.PI) / 180;
const R = 6371;
export const projectKm = (lat: number, lon: number) => [R * (((lon - 12.5) * Math.PI) / 180) * Math.cos(LAT0), -R * (((lat - 42) * Math.PI) / 180)];

/** A place in sheet units (km, y south). */
export const placeXY = (p: { lat: number; lon: number }) => projectKm(p.lat, p.lon);

// graticule every two degrees, as printed on the sheet
export const LONS = [8, 10, 12, 14, 16, 18];
export const LATS = [38, 40, 42, 44, 46];
