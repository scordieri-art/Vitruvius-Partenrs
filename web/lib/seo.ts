import type { Metadata } from "next";
import { company } from "@/content/site";
import { dictionaryFor } from "./content";
import { href, type Locale, type RouteKey } from "./i18n";
import { siteUrl } from "./site";

/**
 * Open Graph and Twitter tags for a page, with its shared-link picture (lib/og.tsx). A page's
 * `openGraph` replaces the layout's whole, so the common fields are repeated here.
 */
export function share(lang: Locale, image: string, og: { type?: "website" | "article"; publishedTime?: string } = {}): Pick<Metadata, "openGraph" | "twitter"> {
  const t = dictionaryFor(lang);
  return {
    openGraph: {
      type: og.type ?? "website",
      ...(og.publishedTime ? { publishedTime: og.publishedTime } : null),
      siteName: t.meta.siteName,
      locale: lang === "it" ? "it_IT" : "en_GB",
      // our own cards are 1200 × 630; an article's picture keeps the size it has
      images: [image.startsWith("/og/") ? { url: image, width: 1200, height: 630, alt: t.meta.siteName } : { url: image, alt: t.meta.siteName }],
    },
    twitter: { card: "summary_large_image", site: "@VitruviusandP", images: [image] },
  };
}

const ENTITIES: Record<string, string> = { amp: "&", nbsp: " ", quot: "\"", apos: "’", lt: "<", gt: ">", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", ndash: "–", mdash: "—" };

/** Plain text from HTML or text with entities: tags out, entities decoded (twice-escaped ones too), spaces collapsed. */
export function plain(html: string): string {
  let s = html.replace(/<[^>]+>/g, " ");
  for (let i = 0; i < 2; i++)
    s = s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) =>
      e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e.toLowerCase()] ?? m),
    );
  return s.replace(/\s+/g, " ").trim();
}

/** A meta description: plain text cut at a word within `max` characters, with an ellipsis when cut. */
export function metaText(text: string, max = 155): string {
  const s = plain(text);
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/**
 * A page title: with the site name after it when it is short, alone when it is long, so the
 * words that matter are the ones a search result shows.
 */
export const metaTitle = (title: string): Metadata["title"] => (plain(title).length > 42 ? { absolute: plain(title) } : plain(title));

/** The shared-link picture of a main page, or of an operation or a position. */
export const ogPath = (lang: Locale, page: string, slug?: string) => `/og/${lang}/${page}${slug ? `/${slug}` : ""}`;

/** Canonical + hreflang alternates for a route available in both languages. */
export function alternates(lang: Locale, key: RouteKey, slugs?: { it?: string | null; en?: string | null }): Metadata["alternates"] {
  const itUrl = slugs ? (slugs.it ? href("it", key, slugs.it) : null) : href("it", key);
  const enUrl = slugs ? (slugs.en ? href("en", key, slugs.en) : null) : href("en", key);
  const languages: Record<string, string> = {};
  if (itUrl) languages.it = itUrl;
  if (enUrl) languages.en = enUrl;
  if (itUrl) languages["x-default"] = itUrl;
  return { canonical: lang === "it" ? itUrl ?? undefined : enUrl ?? undefined, languages };
}

export function organizationJsonLd(lang: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    legalName: company.legalName,
    url: siteUrl + (lang === "en" ? "/en" : ""),
    logo: `${siteUrl}/brand/vp-logo-orizzontale.svg`,
    email: company.email,
    vatID: company.vat,
    sameAs: [company.social.linkedin, company.social.facebook, company.social.x],
    address: company.offices.map((o) => ({
      "@type": "PostalAddress",
      streetAddress: o.street,
      postalCode: o.zip,
      addressLocality: o.city,
      addressRegion: o.region,
      addressCountry: "IT",
    })),
    contactPoint: company.offices.map((o) => ({
      "@type": "ContactPoint",
      telephone: o.phone.replace(/\s/g, ""),
      contactType: "customer service",
      areaServed: "IT",
      availableLanguage: ["Italian", "English"],
    })),
    subOrganization: [
      { "@type": "Organization", name: "Vitruvius Construction", url: company.divisions.construction },
      { "@type": "Organization", name: "Vitruvius Living", url: company.divisions.living },
    ],
  };
}
