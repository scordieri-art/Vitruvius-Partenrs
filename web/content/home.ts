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

/**
 * The companies' own logos, in their own colours, beside the verbs. Vitruvius Construction
 * publishes its logo in white only: here in the blue of its site (#2F5597). Axis Real Estate:
 * the logo file supplied by the group. `f` evens out their optical size (a long one-line logo
 * is drawn lower than a compact one). Vitruvius Living: its logo from its site, under the
 * «add value» step, with the way to its site.
 */
const LOGOS = {
  vp: { src: "/brand/vp-logo-orizzontale.svg", w: 831, h: 71, f: 0.45 },
  construction: { src: "/brand/gruppo/vitruvius-construction.png", w: 1200, h: 238, f: 0.72 },
  axis: { src: "/brand/gruppo/axis-real-estate.svg", w: 470, h: 154, f: 0.94 },
  living: { src: "/brand/gruppo/vitruvius-living.png", w: 300, h: 149, f: 1 },
} as const;

/**
 * The three steps of the group, as the home page tells them: develop (Vitruvius & Partners),
 * build (Vitruvius Construction), add value (Axis Real Estate beside the verb; under it,
 * Vitruvius Living: its published figure and its site, with its logo).
 */
export function homeSteps(lang: Locale): Step[] {
  const t = dictionaryFor(lang);
  return t.group.entities.map((e) => {
    if (e.key === "living") {
      const a = t.home.lines.axis;
      return {
        key: "axis",
        verb: e.verb,
        name: a.name,
        logo: LOGOS.axis,
        text: a.text,
        image: HOME_IMG.living,
        href: e.href,
        linkLabel: e.linkLabel,
        external: true,
        site: { ...LOGOS.living, name: e.name },
        proof: { value: e.proof.value, unit: e.proof.unit, label: e.proof.label, href: proofHref(lang, e.proof.link), linkLabel: e.proof.linkLabel },
      };
    }
    return {
      key: e.key,
      verb: e.verb,
      name: e.name,
      logo: LOGOS[e.key as "vp" | "construction"],
      text: e.text,
      image: HOME_IMG[e.key as "vp" | "construction"],
      href: e.href || href(lang, "about"),
      linkLabel: e.linkLabel,
      external: !!e.href,
      proof: { value: e.proof.value, unit: e.proof.unit, label: e.proof.label, href: proofHref(lang, e.proof.link), linkLabel: e.proof.linkLabel },
    };
  });
}
