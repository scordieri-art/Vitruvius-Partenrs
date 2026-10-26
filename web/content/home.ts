import type { Step } from "@/components/home/Filiera";
import { projects } from "@/content/projects";
import { dictionaryFor } from "@/lib/content";
import { href, type Locale } from "@/lib/i18n";

/** Indicative colour photographs, one series in one treatment (public/images/home/CREDITS.md). */
export const HOME_IMG = {
  hero: "/images/home/home-hero-balconies.jpg",
  vp: "/images/home/home-vp-rooftops.jpg",
  construction: "/images/home/home-construction-scaffolding.jpg",
  living: "/images/home/home-living-sunlit.jpg",
  contact: "/images/home/home-contact-palazzo.jpg",
} as const;

/** "project:<it slug>" → the case page; "about#hash" → a section of the about page. */
const proofHref = (lang: Locale, link: string) => {
  if (!link) return undefined;
  if (link.startsWith("project:")) {
    const p = projects.find((x) => x.slug.it === link.slice(8));
    return p ? href(lang, "projects", p.slug[lang]) : undefined;
  }
  const [, hash] = link.split("#");
  return href(lang, "about", undefined, hash);
};

/** The three steps of the group, as the home page tells them (Filiera and its preview variants). */
export function homeSteps(lang: Locale): Step[] {
  const t = dictionaryFor(lang);
  return t.group.entities.map((e) => ({
    key: e.key,
    verb: e.verb,
    name: e.name,
    kind: e.kind,
    text: e.text,
    image: HOME_IMG[e.key as "vp" | "construction" | "living"],
    href: e.href || href(lang, "about"),
    linkLabel: e.linkLabel,
    external: !!e.href,
    proof: { value: e.proof.value, unit: e.proof.unit, label: e.proof.label, href: proofHref(lang, e.proof.link), linkLabel: e.proof.linkLabel },
  }));
}
