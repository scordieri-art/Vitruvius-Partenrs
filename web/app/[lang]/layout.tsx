import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { PageTransitionProvider } from "@/components/layout/PageTransition";
import { PreloadFonts } from "@/components/layout/PreloadFonts";
import { CursorLabel } from "@/components/ui/CursorLabel";
import { company } from "@/content/site";
import { FONT_KIT } from "@/lib/fonts";
import { projects } from "@/content/projects";
import { dictionaryFor } from "@/lib/content";
import { hasLocale, href, locales, type RouteKey } from "@/lib/i18n";
import { ogPath, organizationJsonLd, share } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#0a2342",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = dictionaryFor(lang);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t.meta.siteName, template: `%s — ${t.meta.siteName}` },
    description: t.meta.description,
    applicationName: t.meta.siteName,
    ...share(lang, ogPath(lang, "home")),
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = dictionaryFor(lang);
  const nav = t.nav.map((n) => ({ href: href(lang, n.key as RouteKey), label: n.label }));
  // the most recent operation, offered as a shortcut in the phone menu
  const lead = projects[0];
  const latest = {
    href: href(lang, "projects", lead.slug[lang]),
    name: lead.name,
    place: lead.place[lang],
    image: lead.image?.src ?? lead.placeholder,
    label: t.ui.latest,
  };

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="" />
        {/* Adobe Fonts web kit "zgd5zbh": Aktiv Grotesk Light 300, Regular 400, Bold 700. Attached by a
            script, not by a plain link: a stylesheet on another server would hold the page's first
            paint (by more than a second on phones). The text shows at once in the fallback face and
            takes Aktiv Grotesk as soon as the kit arrives; its fonts are already on their way
            (PreloadFonts). The kit, with Adobe's page-view stylesheet, still loads on every page. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var l=document.createElement("link");l.rel="stylesheet";l.href="${FONT_KIT}";document.head.appendChild(l)})()` }} />
        <noscript>
          <link rel="stylesheet" href={FONT_KIT} />
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('js-motion')}catch(e){}",
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(lang)) }} />
      </head>
      <body>
        <PreloadFonts />
        <SmoothScroll>
          <PageTransitionProvider>
            <Header
              lang={lang}
              homeHref={href(lang, "home")}
              nav={nav}
              labels={{
                menu: t.ui.menu,
                close: t.ui.close,
                switchTo: t.ui.switchTo,
                switchToShort: t.ui.switchToShort,
                skip: t.ui.skip,
                mainNav: t.ui.mainNav,
                language: t.ui.language,
                home: t.ui.home,
              }}
              contacts={{
                email: company.email,
                phones: company.offices.map((o) => ({ city: o.city, phone: o.phone, href: o.phoneHref })),
              }}
              latest={latest}
            />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <Footer lang={lang} t={t} />
          </PageTransitionProvider>
        </SmoothScroll>
        <CursorLabel />
      </body>
    </html>
  );
}
