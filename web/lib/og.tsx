import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { projects } from "@/content/projects";
import { dictionaryFor, getJobs } from "@/lib/content";
import type { Locale } from "@/lib/i18n";

/**
 * The picture a link shows when shared (LinkedIn, WhatsApp, Slack…): the navy page with the
 * logo, a label, the page's title in large light type and the plane cut on the slope of the
 * symbol. Rendered at build time by the routes in app/og.
 *
 * Type: Inter (SIL Open Font License, assets/fonts/OFL.txt), the closest free cut to Aktiv
 * Grotesk, whose Adobe Fonts licence does not cover embedding in images.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_PAGES = ["home", "about", "projects", "news", "careers", "contact"] as const;
export type OgPage = (typeof OG_PAGES)[number];

const NAVY = "#0A2342";
const SLATE = "#9DAEC4";
const SLOPE = 99.655 / 170;

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/inter-latin-300.woff")),
  readFile(join(process.cwd(), "assets/fonts/inter-latin-400.woff")),
]);
const logo = readFile(join(process.cwd(), "public/brand/vp-logo-orizzontale-bianco.svg")).then(
  (b) => `data:image/svg+xml;base64,${b.toString("base64")}`,
);

type Card = { label: string; title: string; sub?: string };

/** What a page says on its card, from the same copy and data as the page. */
export function ogCard(lang: Locale, page: string, slug?: string): Card | null {
  const t = dictionaryFor(lang);
  if (page === "projects" && slug) {
    const p = projects.find((x) => x.slug[lang] === slug || x.slug.it === slug);
    return p ? { label: `${t.projectsPage.label} · ${p.place[lang]}`, title: p.name, sub: `${p.status[lang]} · ${p.year}` } : null;
  }
  if (page === "careers" && slug) {
    const j = getJobs().find((x) => x.slug === slug);
    return j ? { label: `${t.careersPage.label} · ${t.careersPage.openLabel}`, title: j.title, sub: `${j.location} · ${j.type}` } : null;
  }
  switch (page) {
    case "home":
      return { label: t.home.hero.label, title: t.home.hero.title.join(" "), sub: t.home.hero.lead };
    case "about":
      return { label: t.about.label, title: t.about.title };
    case "projects":
      return { label: t.projectsPage.label, title: t.projectsPage.map.title, sub: t.projectsPage.lead };
    case "news":
      return { label: t.newsPage.label, title: t.newsPage.title };
    case "careers":
      return { label: t.careersPage.label, title: t.careersPage.title };
    case "contact":
      return { label: t.contactPage.label, title: t.contactPage.title, sub: t.contactPage.lead };
  }
  return null;
}

export async function ogImage(card: Card) {
  const [light, regular] = await fonts;
  // longer titles step down so they keep to three lines
  const size = card.title.length > 60 ? 54 : card.title.length > 34 ? 64 : 76;
  const cut = OG_SIZE.height * SLOPE;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: NAVY, fontFamily: "Inter" }}>
        {/* the plane on the slope of the symbol, down to the right */}
        <svg width={OG_SIZE.width} height={OG_SIZE.height} style={{ position: "absolute", left: 0, top: 0 }}>
          <polygon points={`860,0 1200,0 1200,630 ${860 + cut},630`} fill="#12305A" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px 60px", width: 900 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG, not a page */}
          <img src={await logo} width={340} height={29} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, fontWeight: 400, color: SLATE, letterSpacing: 0.2 }}>{card.label}</div>
            <div style={{ marginTop: 20, fontSize: size, fontWeight: 300, color: "white", lineHeight: 1.06, letterSpacing: -size * 0.02 }}>{card.title}</div>
            {card.sub ? <div style={{ marginTop: 26, fontSize: 25, fontWeight: 300, color: "#D6DEE8", lineHeight: 1.4, maxWidth: 720 }}>{card.sub}</div> : null}
          </div>
          <div style={{ fontSize: 20, fontWeight: 400, color: SLATE }}>vitruviusandpartners.com</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: light, weight: 300, style: "normal" },
        { name: "Inter", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
