// Builds typed JSON content from the markdown snapshot of the current website
// (content-raw/). Run with: node scripts/build-content.mjs
// Output: content/generated/{news-it,news-en,jobs,team}.json
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const RAW = process.env.CONTENT_RAW || path.resolve(process.cwd(), '../content-raw');
const OUT = path.resolve(process.cwd(), 'content/generated');
fs.mkdirSync(OUT, { recursive: true });

// Words that must keep their capitalisation when ALL-CAPS titles are sentence-cased
const KEEP = [
  'Vitruvius & Partners', 'Vitruvius and Partners', 'Vitruvius&Partners', 'INPS', 'ISO', 'SOA', 'OG1', 'III', 'II°', 'UE', 'EU', 'BESS',
  'Genova', 'Corso Italia', 'Asti', 'Brianza', 'Milano', 'Casa Betania', 'CasAmica', 'Fondazione Arché', 'Arché', 'Lions Club', 'Lions Clubs',
  'ABIO', 'Guamari', 'Solution Bank', 'Superbonus', 'Top 200', 'Top 60', 'Top 25', 'Pablo T', 'Memorial Benedetta Ragni', 'Benedetta Ragni',
  'Da tutti i paesi', 'Italia', 'Italy', 'Easter', 'Christmas', 'Natale', 'Pasqua', 'LA STAMPA', 'La Stampa', 'Il Secolo XIX', 'IlSole24Ore',
  'Agenparl.eu', 'Avvenire.it', 'Atnews.it', 'Dentrolanotiziabreak.it', 'InformazioneOggi.it', 'IMPRESEDILINEWS.IT', 'Impresedilinews.it',
  'Palio di Asti', 'Trofeo Inter-territoriale', 'Inter-territorial Trophy', '4.0', '2023', '2024', '2025', '2026', 'Via Asinari', 'Italian', 'Lions Clubs', 'Alfieri',
];

const ACRONYMS = new Set(['INPS', 'ISO', 'SOA', 'OG1', 'III', 'II°', 'UE', 'EU', 'IA', 'AI', 'BESS', 'ABIO', 'CO2', 'PIL', 'BIM', 'PV', 'MCC', 'EIF', 'CAT', 'AEC']);
const FIXES = [[/perche’/gi, 'perché'], [/novita’/gi, 'novità'], [/conformita’/gi, 'conformità'], [/qualita’/gi, 'qualità'], [/\bCalss\b/gi, 'Class']];

function sentenceCase(title, lang = 'it') {
  let t = title.replace(/\s+/g, ' ').replace(/‌/g, '').trim();
  const hasCapsWords = /\b[A-ZÀ-Ý]{3,}\b/.test(t.replace(/\b(INPS|ISO|SOA|BESS|ABIO)\b/g, ''));
  if (hasCapsWords) {
    t = t.split(' ').map((w) => {
      const letters = w.replace(/[^A-Za-zÀ-ÿ°0-9]/g, '');
      const acronym = ACRONYMS.has(letters) && !(lang === 'it' && letters === 'AI');
      if (letters.length >= 1 && letters === letters.toUpperCase() && /[A-ZÀ-Ý]/.test(letters) && !acronym) return w.toLowerCase();
      return w;
    }).join(' ');
    for (const k of KEEP) {
      const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?<![A-Za-zÀ-ÿ])${esc}(?![A-Za-zÀ-ÿ])`, 'gi');
      const target = k === 'IMPRESEDILINEWS.IT' ? 'Impresedilinews.it' : k === 'LA STAMPA' ? 'La Stampa' : k;
      t = t.replace(re, target);
    }
    t = t.charAt(0).toUpperCase() + t.slice(1);
    t = t.replace(/(\.\s+)([a-zà-ÿ])/g, (m, p, c) => p + c.toUpperCase());
  }
  for (const [re, rep] of FIXES) t = t.replace(re, rep);
  return t;
}

function cleanBody(md, featured) {
  let body = md.split('<!-- ===== APPENDICE')[0];
  const lines = body.split('\n');
  const kept = [];
  let titleRemoved = false;
  let lede = null;
  for (let raw of lines) {
    const line = raw.trimEnd();
    if (!titleRemoved && /^#{1,3}\s/.test(line)) { titleRemoved = true; continue; }
    if (/^<!--.*-->$/.test(line.trim())) continue;
    if (line.trim().startsWith('<!-- post-info')) continue;
    if (/^!\[\]\((.+)\)\s*$/.test(line.trim())) {
      const url = line.trim().match(/^!\[\]\((.+)\)/)[1];
      if (featured && sameImage(url, featured)) continue;
    }
    if (lede === null && /^###\s/.test(line)) { lede = line.replace(/^###\s+/, '').replace(/\*\*/g, '').trim(); continue; }
    kept.push(line.replace(/<!--.*?-->/g, ''));
  }
  let text = kept.join('\n').replace(/\n-{3,}\s*$/m, '').trim();
  text = text.replace(/\n---\s*$/, '').trim();
  return { lede, html: marked.parse(text, { gfm: true, breaks: false }) };
}


// Tidy imported HTML: the press source ("FONTE: …" + "LEGGI L’ARTICOLO COMPLETO") is
// shown once in the sources box, and all-caps blocks are set in sentence case.
const READ_MORE = /^(leggi l[’']articolo completo|continua a leggere( su)?:?|read the full article|read more|continue reading( on)?:?)\s*$/i;
const isCaps = (t) => {
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
  return letters.length >= 6 && letters === letters.toUpperCase();
};
/** "IMPRESEDILINEWS.IT" → "Impresedilinews.it", "RAPPORTO CLASSIFICHE 2024" → "Rapporto classifiche 2024" */
function niceLabel(t, lang) {
  if (!isCaps(t)) return t;
  if (/^[A-Z0-9.-]+\.[A-Z]{2,}$/.test(t.trim())) { const d = t.trim().toLowerCase(); return d[0].toUpperCase() + d.slice(1); }
  return sentenceCase(t.trim(), lang);
}
function tidyHtml(html, lang) {
  let sourceName = null;
  let out = html.replace(/<p>(?:<strong>)?\s*(?:FONTE|Fonte|SOURCE|Source)\s*:\s*(?:<\/strong>)?\s*([^<]{2,80})<\/p>\s*/g, (_, name) => {
    sourceName = sentenceCase(name.trim(), lang);
    return '';
  });
  out = out.replace(/<p>\s*<a [^>]*>([^<]+)<\/a>\s*<\/p>\s*/g, (m, label) => (READ_MORE.test(label.trim()) ? '' : m));
  out = out.replace(/<(p|h2|h3|h4|strong|li)>([^<]{6,})<\/\1>/g, (m, tag, inner) => {
    const letters = inner.replace(/[^A-Za-zÀ-ÿ]/g, '');
    if (letters.length < 6 || letters !== letters.toUpperCase()) return m;
    return `<${tag}>${sentenceCase(inner.trim(), lang)}</${tag}>`;
  });
  out = out.replace(/(<a [^>]*>)([^<]+)(<\/a>)/g, (_, o, inner, c) => o + niceLabel(inner, lang) + c);
  return { html: out.trim(), sourceName };
}

const stripSize = (u) => u.replace(/-\d+x\d+(?=\.\w+$)/, '');
const sameImage = (a, b) => stripSize(a) === stripSize(b);

function readNews(lang) {
  const files = fs.readdirSync(RAW).filter((f) => f.startsWith(`${lang}-news-`) && f !== `${lang}-news-archive.md`);
  const items = files.map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(RAW, f), 'utf8'));
    const featured = data.featured_image || data.og_image || null;
    const body = cleanBody(content, featured);
    const lede = body.lede;
    const { html, sourceName } = tidyHtml(body.html, lang);
    const titleRaw = (data.post_title || data.title || '').replace(/^Vitruvius & Partners - (Vitruvius & Partners - )?/, '');
    const excerpt = (data.og_description || '').replace(/\s*\.\.\.$/, '…').replace(/wpml_linebreak/g, ' ').trim();
    const translation = data.translation ? String(data.translation).replace(/\/$/, '').split('/').pop() : null;
    // external source links (press) from the appendix
    const appendix = content.split('<!-- ===== APPENDICE')[1] || '';
    const sources = [...appendix.matchAll(/- "(.+?)" → (https?:\/\/\S+)/g)]
      .map((m) => ({ label: m[1], url: m[2] }))
      .filter((s) => !s.url.includes('vitruviusandpartners.com') && !s.url.startsWith('mailto:'))
      .map((s) => ({ ...s, label: niceLabel(READ_MORE.test(s.label.trim()) ? sourceName || s.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : s.label, lang) }));
    return {
      slug: data.slug || f.replace(`${lang}-news-`, '').replace(/\.md$/, ''),
      lang,
      title: sentenceCase(titleRaw, lang),
      titleOriginal: titleRaw,
      date: (data.publish_date || data.published || '').slice(0, 10),
      excerpt,
      lede,
      image: featured ? stripSize(featured) : null,
      html,
      sources,
      translation,
      legacyUrl: data.url,
    };
  });
  items.sort((a, b) => (a.date < b.date ? 1 : -1));
  return items;
}

function readJobs() {
  const files = fs.readdirSync(RAW).filter((f) => f.startsWith('it-job-'));
  return files.map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(RAW, f), 'utf8'));
    let body = content.split('<!-- ===== APPENDICE')[0];
    const [descPart, rest = ''] = body.split(/## \*\*CANDIDATI ONLINE\*\*/);
    const lines = descPart.split('\n').filter((l) => !/^## /.test(l) && !/^- (Tipo di contratto|Sede|Data pubblicazione) \(badge\)/.test(l));
    const specs = [...rest.matchAll(/^\| ([^|]+?) \| ([^|]+?) \|$/gm)]
      .map((m) => ({ label: m[1].trim(), value: m[2].trim() }))
      .filter((s) => s.label && s.label !== '---');
    // non-breaking space before the dash: it never starts a line
    const title = (data.title || '').replace(/ - Vitruvius & Partners$/, '').replace(/ - /g, '\u00a0– ');
    return {
      slug: data.slug,
      title,
      type: data['Tipo di contratto (badge)'] || '',
      location: data['Sede (badge)'] || '',
      updated: (data.modified || '').slice(0, 10),
      html: tidyHtml(marked.parse(lines.join('\n').trim()), 'it').html,
      specs,
      legacyUrl: data.url,
    };
  });
}

function readTeam() {
  const idx = fs.readFileSync(path.join(RAW, 'INDEX.md'), 'utf8');
  const sec = idx.split('## 6.')[1].split('## 7.')[0];
  const rows = [...sec.matchAll(/^\| (\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]*) \|$/gm)];
  const titleCase = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|\s|’|')([a-zà-ÿ])/g, (m, p, c) => p + c.toUpperCase()) : s);
  const groups = [];
  for (const r of rows) {
    const group = r[2].trim();
    let g = groups.find((x) => x.key === group);
    if (!g) { g = { key: group, people: [] }; groups.push(g); }
    const roleParts = r[4].split(' / ').map((s) => s.trim());
    const role = roleParts[0] === roleParts[0].toUpperCase() ? titleCase(roleParts[0]).replace(/\bCeo\b/g, 'CEO').replace(/Co-Founder/g, 'Co-founder') : roleParts[0];
    const unit = roleParts[1] ? titleCase(roleParts[1]) : null;
    g.people.push({ name: titleCase(r[3].trim()), role, unit, photo: r[5].trim() || null });
  }
  return groups;
}

const newsIt = readNews('it');
const newsEn = readNews('en');
const jobs = readJobs();
const team = readTeam();
fs.writeFileSync(path.join(OUT, 'news-it.json'), JSON.stringify(newsIt, null, 1));
fs.writeFileSync(path.join(OUT, 'news-en.json'), JSON.stringify(newsEn, null, 1));
fs.writeFileSync(path.join(OUT, 'jobs.json'), JSON.stringify(jobs, null, 1));
fs.writeFileSync(path.join(OUT, 'team.json'), JSON.stringify(team, null, 1));
console.log('news it', newsIt.length, 'news en', newsEn.length, 'jobs', jobs.length, 'team', team.map((g) => `${g.key}:${g.people.length}`).join(', '));
