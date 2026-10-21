import type { Locale } from "@/lib/i18n";

/**
 * Credibility data, each item with the published source it comes from.
 * Sources are the group's own News & Press (Italian slugs; the English site
 * links the translation when one exists) and the documents it publishes.
 */
type L = Record<Locale, string>;

export type Source = { news?: string; url?: string; label: L };

/** Value of production, € million (company releases). */
export const production: { year: string; value: number; display: L; change?: L; source: Source }[] = [
  {
    year: "2021",
    value: 35,
    display: { it: "35", en: "35" },
    source: { news: "vitruvius-amp-partners-in-crescita", label: { it: "Comunicato, maggio 2023", en: "Release, May 2023" } },
  },
  {
    year: "2022",
    value: 73,
    display: { it: "73", en: "73" },
    change: { it: "+109%", en: "+109%" },
    source: { news: "vitruvius-amp-partners-in-crescita", label: { it: "Comunicato, maggio 2023", en: "Release, May 2023" } },
  },
  {
    year: "2023",
    value: 73.8,
    display: { it: "73,8", en: "73.8" },
    change: { it: "+1,1%", en: "+1.1%" },
    source: { news: "vitruvius-partners-ancora-tra-le-top-nel-ranking-guamari-2024", label: { it: "Rapporto Guamari, dicembre 2024", en: "Guamari report, December 2024" } },
  },
];

/** Position in the Top 200 construction companies ranking (lower is better). */
export const top200 = {
  of: 200,
  points: [
    { year: "2022", rank: 169 },
    { year: "2024", rank: 83 },
  ],
  source: {
    news: "vitruvius-partners-una-scalata-straordinaria-nella-classifica-delle-top-200-costruzioni",
    label: { it: "News, ottobre 2024", en: "News, October 2024" },
  } as Source,
};

/** Guamari ranking of Italian private-construction companies. */
export const guamari: { year: string; rank: number; of: number; source: Source }[] = [
  {
    year: "2023",
    rank: 24,
    of: 65,
    source: { news: "vitruvius-partners-tra-le-top-25-imprese-italiane-di-edilizia-privata", label: { it: "News, dicembre 2023", en: "News, December 2023" } },
  },
  {
    year: "2024",
    rank: 31,
    of: 70,
    source: { news: "vitruvius-partners-ancora-tra-le-top-nel-ranking-guamari-2024", label: { it: "News, dicembre 2024", en: "News, December 2024" } },
  },
];

/** Activity figures declared by the group on its website. */
export const declared: { value: string; label: L; kind: "done" | "planned" }[] = [
  { value: "300+", label: { it: "cantieri completati", en: "sites completed" }, kind: "done" },
  { value: "50+", label: { it: "progetti già contrattualizzati", en: "projects already under contract" }, kind: "planned" },
  { value: "30+", label: { it: "città in cui il gruppo è presente", en: "cities where the group operates" }, kind: "done" },
  { value: "200+", label: { it: "immobili realizzati ogni anno da Vitruvius Living", en: "homes delivered each year by Vitruvius Living" }, kind: "done" },
];

export const qualifications: { name: string; scope: L; date: L; link: { kind: "pdf"; key: "iso9001" | "iso9001Renewal" } | { kind: "news"; news: string } }[] = [
  {
    name: "ISO 9001:2015",
    scope: {
      it: "Sistema di gestione della qualità per i servizi di manutenzione di edifici civili.",
      en: "Quality management system for maintenance services of civil buildings.",
    },
    date: { it: "Gennaio 2023 · rinnovo 2025", en: "January 2023 · renewed 2025" },
    link: { kind: "pdf", key: "iso9001" },
  },
  {
    name: "SOA OG1 · classe III",
    scope: {
      it: "Qualificazione per le gare d’appalto di opere pubbliche e per i lavori oltre 516.000 € legati ai bonus edilizi.",
      en: "Qualification for public works tenders and for building-bonus works above €516,000.",
    },
    date: { it: "Febbraio 2023", en: "February 2023" },
    link: { kind: "news", news: "attestazione-soa-vitruvius-partners-consegue-la-certificazione-per-la-categoria-og1-classe-iii" },
  },
];
