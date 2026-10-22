import { OG_PAGES, ogCard, ogImage } from "@/lib/og";
import { hasLocale, locales } from "@/lib/i18n";

// the shared-link picture of each main page, rendered at build time (any other address: 404)

export function generateStaticParams() {
  return locales.flatMap((lang) => OG_PAGES.map((page) => ({ lang, page })));
}

export async function GET(_req: Request, { params }: RouteContext<"/og/[lang]/[page]">) {
  const { lang, page } = await params;
  const card = hasLocale(lang) ? ogCard(lang, page) : null;
  return card ? ogImage(card) : new Response("Not found", { status: 404 });
}
