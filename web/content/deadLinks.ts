/**
 * Sources that have gone from the web since they were cited (checked October 2026). Each
 * points to its copy on the Internet Archive; `null` where no copy exists, and the source
 * is then shown by name, marked as no longer online. Applied wherever a source is linked
 * (lib/content.ts `liveLink`), so the generated content stays as published.
 */
export const deadLinks: Record<string, string | null> = {
  "https://www.guamari.it/_files/ugd/30ba77_129b7223a75b43349494ebddff8d8573.pdf":
    "https://web.archive.org/web/20230530175746/https://www.guamari.it/_files/ugd/30ba77_129b7223a75b43349494ebddff8d8573.pdf",
  "https://www.avvenire.it/economia/pagine/mercato-del-lavoro-serve-l-orientamento-per-renderlo-piu-efficiente":
    "https://web.archive.org/web/20250522095622/https://www.avvenire.it/economia/pagine/mercato-del-lavoro-serve-l-orientamento-per-renderlo-piu-efficiente",
  "https://www.pablotart.com/": "https://web.archive.org/web/20260117213742/https://www.pablotart.com/",
  "https://pledgetimes.com/sustainable-construction-bill-proof-contract-worth-10-million-per-block/": null,
  "https://dentrolanotiziabreak.it/vitruvius-partners-10mila-euro-palio-asti/": null,
};
