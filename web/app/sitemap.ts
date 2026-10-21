import type { MetadataRoute } from "next";
import { company } from "@/content/site";
import { projects } from "@/content/projects";
import { getJobs, getNews, newsCounterpart } from "@/lib/content";
import { href, type RouteKey } from "@/lib/i18n";

const abs = (path: string) => `${company.url}${path === "/" ? "" : path}`;

function pair(key: RouteKey, it: string | null, en: string | null, lastModified?: string): MetadataRoute.Sitemap {
  const itUrl = it !== null ? abs(href("it", key, it || undefined)) : null;
  const enUrl = en !== null ? abs(href("en", key, en || undefined)) : null;
  const languages: Record<string, string> = {};
  if (itUrl) languages.it = itUrl;
  if (enUrl) languages.en = enUrl;
  return [itUrl, enUrl]
    .filter((u): u is string => Boolean(u))
    .map((url) => ({ url, lastModified, alternates: { languages } }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = (["home", "about", "projects", "news", "careers", "contact"] as const).flatMap((k) => pair(k, "", ""));

  const projectPages = projects.flatMap((p) => pair("projects", p.slug.it, p.slug.en));

  const itNews = getNews("it");
  const enNews = getNews("en");
  const seenEn = new Set<string>();
  const newsPages = itNews.flatMap((n) => {
    const en = newsCounterpart("it", n);
    if (en) seenEn.add(en);
    return pair("news", n.slug, en, n.date);
  });
  const enOnly = enNews.filter((n) => !seenEn.has(n.slug)).flatMap((n) => pair("news", null, n.slug, n.date));

  // Job posts are published in Italian; the English route shows the same text with a note.
  const jobPages = getJobs().flatMap((j) => pair("careers", j.slug, j.slug, j.updated));

  return [...pages, ...projectPages, ...newsPages, ...enOnly, ...jobPages];
}
