// Copies the images and documents the pages still took from the old WordPress site (news covers,
// pictures inside the articles, the operations' pictures, the certificates) into public/legacy/,
// so the pages never wait on the old site and keep working once it is gone. Pictures are reduced
// to at most 2400 px on the long side (one news cover was an 18 MB original); a picture already
// small enough keeps its own bytes when re-encoding would only make it heavier; documents are
// kept as they are. Files no page refers to any more are removed. Run after build-content.mjs:
//   NODE_USE_ENV_PROXY=1 node scripts/legacy-images.mjs
// (NODE_USE_ENV_PROXY only where outbound requests go through a proxy.)
// Output: public/legacy/<year>/<month>/<name> and content/generated/legacy-files.json (old URL → file).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const LONG = 2400;
const SOURCES = ['content/generated/news-it.json', 'content/generated/news-en.json', 'content/projects.ts', 'content/site.ts'];
const RE = /https:\/\/(?:www\.)?vitruviusandpartners\.com\/wp-content\/uploads\/[^"'\s,)\\<>]+/g;
const OUT = 'content/generated/legacy-files.json';

const urls = new Set();
for (const f of SOURCES) for (const u of fs.readFileSync(f, 'utf8').match(RE) ?? []) urls.add(u);
// already moved: the sources then name the local file, so keep what the map knows
const map = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const used = new Set(SOURCES.flatMap((f) => fs.readFileSync(f, 'utf8').match(/\/legacy\/[^"'\s,)\\<>]+/g) ?? []));
for (const [u, v] of Object.entries(map)) if (used.has(v.path)) urls.add(u);

// "II%C2%B0-TROFEO.jpg" → "II-TROFEO.jpg": plain names, served as they are written
const plain = (name) => decodeURIComponent(name).normalize('NFD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-');

let fetched = 0;
for (const url of [...urls].sort()) {
  if (map[url] && fs.existsSync(path.join('public', map[url].path))) continue;
  const [, year, month, raw] = url.match(/uploads\/(\d{4})\/(\d{2})\/(.+)$/) ?? [];
  if (!raw) continue;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn('skipped', res.status, url);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const dir = path.join('public/legacy', year, month);
  fs.mkdirSync(dir, { recursive: true });
  const name = plain(raw);
  const ext = path.extname(name).toLowerCase();
  if (ext === '.pdf') {
    fs.writeFileSync(path.join(dir, name), buf);
    map[url] = { path: `/legacy/${year}/${month}/${name}` };
  } else {
    const meta = await sharp(buf).metadata();
    // transparency is kept only where it is really used
    const alpha = meta.hasAlpha && !(await sharp(buf).stats()).isOpaque;
    const file = name.replace(/\.(jpe?g|png|webp)$/i, alpha ? '.png' : '.jpg');
    const big = Math.max(meta.width ?? 0, meta.height ?? 0) > LONG;
    const sized = sharp(buf, { failOn: 'none' }).rotate().resize({ width: LONG, height: LONG, fit: 'inside', withoutEnlargement: true });
    let out = await (alpha ? sized.png({ compressionLevel: 9, palette: true, quality: 90 }) : sized.flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true })).toBuffer({ resolveWithObject: true });
    if (!big && meta.format === (alpha ? 'png' : 'jpeg') && out.data.length > buf.length) out = { data: buf, info: { width: meta.width, height: meta.height } };
    fs.writeFileSync(path.join(dir, file), out.data);
    map[url] = { path: `/legacy/${year}/${month}/${file}`, width: out.info.width, height: out.info.height };
  }
  fetched++;
  console.log(`${map[url].path}  ${Math.round(buf.length / 1024)} KB → ${Math.round(fs.statSync(path.join('public', map[url].path)).size / 1024)} KB`);
}
// files no page refers to any more
for (const [u, v] of Object.entries(map)) {
  if (urls.has(u)) continue;
  fs.rmSync(path.join('public', v.path), { force: true });
  delete map[u];
  console.log('removed', v.path);
}
const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n');
console.log(`${fetched} copied, ${Object.keys(sorted).length} in ${OUT}`);
