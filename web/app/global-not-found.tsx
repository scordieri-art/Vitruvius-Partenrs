import "./globals.css";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { dictionaryFor } from "@/lib/content";
import { href } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "404 — Vitruvius & Partners",
  description: "Questa pagina non esiste. This page does not exist.",
};

const it = dictionaryFor("it");
const en = dictionaryFor("en");

/**
 * 404 for every unmatched address. The root layout lives in a dynamic segment (app/[lang]),
 * so Next.js cannot compose a global 404 from it: this page is a full document of its own
 * (styles and the Adobe Fonts kit imported here), in Italian with English underneath, as the
 * language of an unknown address cannot be told.
 */
export default function GlobalNotFound() {
  const links = [
    { href: href("it", "home"), label: it.notFound.cta },
    { href: href("it", "projects"), label: it.meta.titles.projects },
    { href: href("it", "contact"), label: it.meta.titles.contact },
  ];
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="stylesheet" href="https://use.typekit.net/zgd5zbh.css" />
      </head>
      <body>
        <main data-theme="paper" className="vp-404 relative flex min-h-svh flex-col overflow-hidden">
          {/* the brand's cut: a navy plane on the slope of the symbol */}
          <span aria-hidden="true" className="vp-404__plane" />
          <header className="container-x relative flex h-[var(--header-h)] items-center">
            <a href={href("it", "home")} aria-label={`Vitruvius & Partners — ${it.ui.home}`} className="block py-3">
              <Logo variant="color" className="h-auto w-[min(220px,58vw)]" decorative />
            </a>
          </header>
          <section className="container-x relative flex flex-1 flex-col justify-end pb-[max(4rem,10vh)] pt-24">
            <p className="t-label mb-6">404</p>
            <h1 className="t-xl max-w-[12ch]">{it.notFound.title}</h1>
            <p className="t-body-l mt-6 max-w-[40ch] text-[var(--fg-2)]">{it.notFound.text}</p>
            <ul className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="vp-cta">
                    <span className="vp-cta__rule" aria-hidden="true" />
                    <span className="vp-cta__text">{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div lang="en" className="mt-14 max-w-[40ch] border-t border-[var(--line)] pt-6">
              <p className="t-body text-[var(--fg-2)]">
                {en.notFound.title} {en.notFound.text}
              </p>
              <a href={href("en", "home")} className="vp-ulink t-body mt-3 inline-block">
                {en.notFound.cta}
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
