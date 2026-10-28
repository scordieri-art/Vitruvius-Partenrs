import { Logo } from "@/components/brand/Logo";
import { SYMBOL_POLYGONS, SYMBOL_VIEWBOX } from "@/components/brand/logo-paths";
import { RevealScope } from "./RevealScope";
import { company } from "@/content/site";
import type { Dictionary } from "@/content/dictionaries/it";
import { href, type Locale } from "@/lib/i18n";
import type { CSSProperties } from "react";
import { TLink } from "./PageTransition";
import { BackToTop } from "./BackToTop";

const points = (pts: [number, number][]) => pts.map(([x, y]) => `${x},${y}`).join(" ");

/**
 * The ending. First the closing: how to reach the group, large (the email, a phone for each
 * office), beside the symbol drawn large in outline, which turns solid as it comes into view
 * (outline → solid, as everywhere on the site). Then, quieter: who, where, the qualifications,
 * the legal line.
 */
export function Footer({ lang, t }: { lang: Locale; t: Dictionary }) {
  const year = 2026;
  const soaSlug = "attestazione-soa-vitruvius-partners-consegue-la-certificazione-per-la-categoria-og1-classe-iii";
  const soaHref = lang === "it" ? href("it", "news", soaSlug) : href("en", "news", "soa-attestation-vitruvius-partners-achieves-certification-for-category-og1-calss-iii");
  const ext = <span className="sr-only"> ({t.ui.externalNew})</span>;

  return (
    <footer data-theme="paper" className="vp-foot border-t border-[var(--line)] pt-[clamp(3rem,7vw,6rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="container-x">
        <RevealScope>
          <div className="vp-foot__close">
            <div>
              <h2 className="t-label mb-5">{t.footer.contacts}</h2>
              <a className="vp-foot__mail vp-ulink" href={`mailto:${company.email}`}>
                {company.email}
              </a>
              <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-3 t-body-l">
                {company.offices.map((o) => (
                  <li key={o.key}>
                    <span className="t-label mr-3">{o.city}</span>
                    <a className="vp-ulink t-num" href={o.phoneHref}>
                      {o.phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="vp-foot__mark" data-reveal="fill">
              <svg viewBox={SYMBOL_VIEWBOX} className="vp-mark vp-mark--solid vp-foot__symbol" aria-hidden="true" focusable="false">
                <polygon points={points(SYMBOL_POLYGONS.primary)} style={{ "--d": 0 } as CSSProperties} />
                <polygon points={points(SYMBOL_POLYGONS.secondary)} className="vp-foot__sec" style={{ "--d": 2 } as CSSProperties} />
              </svg>
            </div>
          </div>
        </RevealScope>

        <div className="grid-12 gap-y-9">
          <div className="col-span-4 lg:col-span-4">
            <TLink href={href(lang, "home")} className="block w-fit" aria-label={`Vitruvius & Partners — ${t.ui.home}`} transitionLabel="Vitruvius & Partners">
              <Logo variant="color" className="h-auto w-[200px] lg:w-[240px]" decorative />
            </TLink>
          </div>

          <nav aria-label={t.footer.nav} className="col-span-2 lg:col-span-2 lg:col-start-5">
            <h2 className="t-label mb-4">{t.footer.nav}</h2>
            <ul className="grid gap-2 t-small">
              {t.nav.map((n) => (
                <li key={n.key}>
                  <TLink href={href(lang, n.key as Parameters<typeof href>[1])} className="vp-ulink" transitionLabel={n.label}>
                    {n.label}
                  </TLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-2 lg:col-span-3">
            <h2 className="t-label mb-4">{t.footer.offices}</h2>
            <ul className="grid gap-5 t-small">
              {company.offices.map((o) => (
                <li key={o.key}>
                  <address className="not-italic">
                    <span className="block">{o.city}</span>
                    <span className="block text-[var(--fg-2)]">
                      {o.street}, {o.postal.replace(/\s*\(.*\)$/, "")}
                    </span>
                  </address>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-4 grid gap-8 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
            <div>
              <h2 className="t-label mb-4">{t.footer.more}</h2>
              <ul className="grid gap-2 t-small">
                <li>
                  <span className="text-[var(--fg-2)]">PEC </span>
                  <a className="vp-ulink" href={`mailto:${company.pec}`}>
                    {company.pec}
                  </a>
                </li>
                <li>
                  <a className="vp-ulink" href={company.social.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn {ext}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="t-label mb-4">{t.footer.certs}</h2>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 t-small lg:grid lg:gap-2">
                <li>
                  <a className="vp-ulink" href={company.certifications.iso9001} target="_blank" rel="noopener noreferrer">
                    ISO 9001:2015 <span className="text-[var(--fg-2)]">PDF</span>
                    {ext}
                  </a>
                </li>
                <li>
                  <a className="vp-ulink" href={company.certifications.iso9001Renewal} target="_blank" rel="noopener noreferrer">
                    {lang === "it" ? "Rinnovo ISO 9001" : "ISO 9001 renewal"} <span className="text-[var(--fg-2)]">PDF</span>
                    {ext}
                  </a>
                </li>
                <li>
                  <TLink className="vp-ulink" href={soaHref}>
                    {lang === "it" ? "Attestazione SOA OG1 – classe III" : "SOA attestation OG1 – class III"}
                  </TLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-[clamp(2.5rem,6vw,5rem)] flex flex-col gap-4 border-t border-[var(--line)] pt-6 lg:flex-row lg:items-baseline lg:justify-between">
          <p className="t-label max-w-[72ch]">
            © {year} {company.legalName} · {t.contactPage.vat} {company.vat} · {t.contactPage.capital} {company.shareCapital}. {t.footer.rights}
          </p>
          <div className="flex items-center gap-6 t-label">
            <TLink className="vp-ulink" href={href(lang, "privacy")}>
              {t.meta.titles.privacy}
            </TLink>
            <BackToTop label={t.footer.backTop} />
          </div>
        </div>
      </div>
    </footer>
  );
}
