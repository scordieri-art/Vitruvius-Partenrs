// Copies the team's portraits from the current website into public/team/, so the pages serve
// them from this site and never wait on the old one. Run after build-content.mjs:
//   node scripts/team-photos.mjs
// Output: public/team/<name>.jpg and content/generated/team-photos.json (name → path).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const team = JSON.parse(fs.readFileSync('content/generated/team.json', 'utf8'));
const DIR = path.resolve('public/team');
fs.mkdirSync(DIR, { recursive: true });

// stand-ins the website shows for people without a portrait: they get their initials instead
const PLACEHOLDERS = [/\/woman-\d*\.jpg$/];

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const map = {};
for (const g of team) {
  for (const p of g.people) {
    if (!p.photo || PLACEHOLDERS.some((re) => re.test(p.photo))) continue;
    const file = `${slug(p.name)}.jpg`;
    const res = await fetch(p.photo);
    if (!res.ok) {
      console.warn('skip', p.name, res.status);
      continue;
    }
    // leaders are shown large: keep up to 1600 px; everyone else up to 1000 px
    const max = g.key === 'LEADERSHIP' ? 1600 : 1000;
    await sharp(Buffer.from(await res.arrayBuffer()))
      .flatten({ background: '#ffffff' })
      .resize(max, max, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(path.join(DIR, file));
    map[p.name] = `/team/${file}`;
  }
}
fs.writeFileSync('content/generated/team-photos.json', JSON.stringify(map, null, 1));
console.log('portraits', Object.keys(map).length);
