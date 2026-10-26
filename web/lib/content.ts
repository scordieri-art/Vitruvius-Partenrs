import { lang as rootLang } from "next/root-params";
import { notFound } from "next/navigation";
import it from "@/content/dictionaries/it";
import en from "@/content/dictionaries/en";
import newsIt from "@/content/generated/news-it.json";
import newsEn from "@/content/generated/news-en.json";
import jobsData from "@/content/generated/jobs.json";
import teamData from "@/content/generated/team.json";
import teamPhotos from "@/content/generated/team-photos.json";
import { deadLinks } from "@/content/deadLinks";
import { hasLocale, href, type Locale } from "./i18n";

export type NewsItem = (typeof newsIt)[number];
export type Job = (typeof jobsData)[number];
export type TeamGroup = (typeof teamData)[number];

const dictionaries = { it, en } as const;

/** Current locale from the root `[lang]` segment. */
export async function getLocale(): Promise<Locale> {
  const value = await rootLang();
  if (!hasLocale(value)) notFound();
  return value;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { lang: locale, t: dictionaries[locale] };
}

export const dictionaryFor = (lang: Locale) => dictionaries[lang];

/** Where a cited source can be read today: its archived copy if it has gone, null if nothing is left. */
export const liveLink = (url: string): string | null => (url in deadLinks ? deadLinks[url] : url);

const GONE: Record<Locale, string> = { it: "non più online", en: "no longer online" };
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** An article with its gone sources mended: archived copies linked, the rest left as names. */
export type Article = Omit<NewsItem, "sources"> & { sources: { label: string; url: string; gone?: boolean }[] };

function mend(item: NewsItem, lang: Locale): Article {
  let html = item.html;
  for (const [url, copy] of Object.entries(deadLinks)) {
    if (!html.includes(url)) continue;
    html = copy
      ? html.split(url).join(copy)
      : html.replace(new RegExp(`<a [^>]*href="${escapeRe(url)}"[^>]*>(.*?)</a>`, "g"), `$1 <span class="t-label">(${GONE[lang]})</span>`);
  }
  const sources = item.sources.map((s) => {
    const live = liveLink(s.url);
    return live ? { ...s, url: live } : { ...s, gone: true };
  });
  return { ...item, html, sources };
}

const mended = { it: (newsIt as NewsItem[]).map((n) => mend(n, "it")), en: (newsEn as NewsItem[]).map((n) => mend(n, "en")) };

export function getNews(lang: Locale): Article[] {
  return mended[lang];
}

export function getNewsItem(lang: Locale, slug: string) {
  return getNews(lang).find((n) => n.slug === slug);
}

/** The counterpart slug in the other language, if a translation exists. */
export function newsCounterpart(lang: Locale, item: Pick<NewsItem, "slug" | "translation">): string | null {
  const other: Locale = lang === "it" ? "en" : "it";
  if (item.translation && getNews(other).some((n) => n.slug === item.translation)) return item.translation;
  const back = getNews(other).find((n) => n.translation === item.slug);
  return back ? back.slug : null;
}

export const getJobs = (): Job[] => jobsData as Job[];
/** The team, each portrait served from this site (scripts/team-photos.mjs); no portrait, no photo. */
export const getTeam = (): TeamGroup[] =>
  (teamData as TeamGroup[]).map((g) => ({
    ...g,
    people: g.people.map((p) => ({ ...p, photo: (teamPhotos as Record<string, string>)[p.name] ?? null })),
  }));

/** Link to a news item given its Italian slug: the English translation when one exists. */
export function newsHref(lang: Locale, itSlug: string): string {
  if (lang === "it") return href("it", "news", itSlug);
  const source = (newsIt as NewsItem[]).find((n) => n.slug === itSlug);
  const match = (newsEn as NewsItem[]).find((n) => n.translation === itSlug || (!!source?.translation && n.slug === source.translation));
  return match ? href("en", "news", match.slug) : href("it", "news", itSlug);
}

/** Display names for outlets whose name the legacy titles run together. */
const OUTLET_NAMES: Record<string, string> = { IlSole24Ore: "Il Sole 24 Ore" };

/**
 * Press-review items carry the outlet at the start of the title ("La Stampa: …",
 * "Avvenire.it: …"). Returns the outlet and the title without it, or null for the
 * group's own news. Only a domain-like prefix or a known newspaper counts as an outlet,
 * so titles such as "Attestazione SOA: …" stay with the group's news.
 */
export function pressOutlet(title: string): { outlet: string; title: string } | null {
  const m = title.match(/^([A-Za-z][\w-]*\.(?:it|eu|com|net)|La Stampa|IlSole24Ore):\s+(.+)$/);
  if (!m) return null;
  return { outlet: OUTLET_NAMES[m[1]] ?? m[1], title: m[2] };
}

/**
 * Headings of published HTML renumbered under the page's own h1: the text's highest level
 * becomes h2 and the others follow, so the outline has no gaps (the WordPress texts start at
 * h4). Looks do not change: the prose styles h2–h4 alike.
 */
export function outline(html: string): string {
  const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  if (!levels.length) return html;
  const shift = Math.min(...levels) - 2;
  return shift ? html.replace(/<(\/?)h([1-6])\b/gi, (_, close: string, n: string) => `<${close}h${Math.min(6, Math.max(2, Number(n) - shift))}`) : html;
}
