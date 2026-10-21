export const locales = ["it", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "it";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** Route keys → public path segment per language. Internal folders use the Italian segment. */
export const routes = {
  home: { it: "", en: "" },
  about: { it: "chi-siamo", en: "about-us" },
  projects: { it: "progetti", en: "projects" },
  news: { it: "news", en: "news" },
  careers: { it: "lavora-con-noi", en: "careers" },
  contact: { it: "contatti", en: "contact" },
  privacy: { it: "privacy", en: "privacy" },
} as const;

export type RouteKey = keyof typeof routes;

/** Public URL for a route in a language. */
export function href(lang: Locale, key: RouteKey, slug?: string, hash?: string): string {
  const seg = routes[key][lang];
  const base = lang === "it" ? "" : "/en";
  let path = `${base}/${seg}`.replace(/\/+$/, "");
  if (slug) path += `/${slug}`;
  if (!path) path = "/";
  return hash ? `${path}#${hash}` : path;
}

/** Map an EN public first segment to the internal (IT) folder name. */
export const enToInternal: Record<string, string> = Object.fromEntries(
  Object.values(routes)
    .filter((r) => r.en && r.en !== r.it)
    .map((r) => [r.en, r.it]),
);

/** Map an internal (IT) folder name to the EN public segment. */
export const internalToEn: Record<string, string> = Object.fromEntries(
  Object.entries(enToInternal).map(([en, it]) => [it, en]),
);

export function formatDate(iso: string, lang: Locale, style: "long" | "short" = "long"): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat(lang === "it" ? "it-IT" : "en-GB", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(d);
}
