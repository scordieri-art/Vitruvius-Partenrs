import type { Metadata } from "next";
import { company } from "@/content/site";
import { href, type Locale, type RouteKey } from "./i18n";

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
    url: company.url + (lang === "en" ? "/en" : ""),
    logo: `${company.url}/brand/vp-logo-orizzontale.svg`,
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
