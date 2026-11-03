// Builds the relief of the site map (public/map/rilievo.png) from the open Terrain Tiles on AWS
// (Terrarium encoding; at these zooms GMTED2010 by USGS and ETOPO1 by NOAA, public domain).
// usage: node tools/build-relief.mjs <dir holding node_modules with sharp> <tile cache dir> <out png>
// The PNG covers the sheet of italia.svg (equirectangular km around 42°N 12.5°E, see build-map.mjs),
// one pixel every STEP km; each pixel holds the height in metres plus 500, red the high byte and
// green the low one (blue unused), so a canvas can read it back exactly.
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "fs";
import { createRequire } from "module";

const [G, CACHE, OUT] = process.argv.slice(2);
const sharp = createRequire(G + "/package.json")("sharp");
const Z = 7;
const STEP = 2.5;
const SHEET = { x: -560, y: -620, w: 1160, h: 1260 };
const KM_LON = 6371 * (Math.PI / 180) * Math.cos((42 * Math.PI) / 180);
const KM_LAT = 6371 * (Math.PI / 180);
const lonOf = (x) => 12.5 + x / KM_LON;
const latOf = (y) => 42 - y / KM_LAT;
const tx = (lon) => ((lon + 180) / 360) * 2 ** Z;
const ty = (lat) => ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** Z;

// the tiles under the sheet
const x0 = Math.floor(tx(lonOf(SHEET.x))), x1 = Math.floor(tx(lonOf(SHEET.x + SHEET.w)));
const y0 = Math.floor(ty(latOf(SHEET.y))), y1 = Math.floor(ty(latOf(SHEET.y + SHEET.h)));
mkdirSync(CACHE, { recursive: true });
const tiles = new Map();
for (let x = x0; x <= x1; x++)
  for (let y = y0; y <= y1; y++) {
    const f = `${CACHE}/${Z}-${x}-${y}.png`;
    if (!existsSync(f)) {
      const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`);
      if (!r.ok) throw new Error(`tile ${x},${y}: ${r.status}`);
      writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    }
    const { data, info } = await sharp(readFileSync(f)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== 256 || info.channels !== 3) throw new Error(`tile ${x},${y}: unexpected ${info.width}×${info.channels}`);
    tiles.set(`${x},${y}`, data);
  }
console.log(`tiles z${Z}: x ${x0}–${x1}, y ${y0}–${y1} (${tiles.size})`);

// height in metres at a point of the mosaic (Terrarium: R·256 + G + B/256 − 32768)
const at = (px, py) => {
  const x = Math.floor(px / 256), y = Math.floor(py / 256);
  const t = tiles.get(`${x},${y}`);
  if (!t) return 0;
  const i = ((py - y * 256) * 256 + (px - x * 256)) * 3;
  return t[i] * 256 + t[i + 1] + t[i + 2] / 256 - 32768;
};
const sample = (lon, lat) => {
  const fx = tx(lon) * 256 - 0.5, fy = ty(lat) * 256 - 0.5;
  const ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
  return (at(ix, iy) * (1 - u) + at(ix + 1, iy) * u) * (1 - v) + (at(ix, iy + 1) * (1 - u) + at(ix + 1, iy + 1) * u) * v;
};

const W = Math.round(SHEET.w / STEP), H = Math.round(SHEET.h / STEP);
const out = Buffer.alloc(W * H * 3);
let hi = -Infinity;
for (let j = 0; j < H; j++)
  for (let i = 0; i < W; i++) {
    const h = sample(lonOf(SHEET.x + (i + 0.5) * STEP), latOf(SHEET.y + (j + 0.5) * STEP));
    hi = Math.max(hi, h);
    const v = Math.max(0, Math.min(65535, Math.round(h) + 500));
    const k = (j * W + i) * 3;
    out[k] = v >> 8;
    out[k + 1] = v & 255;
  }
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9, palette: false }).toFile(OUT);
console.log(`${OUT}: ${W}×${H}, ${STEP} km a pixel, highest ${Math.round(hi)} m`);
