import { ogCard, ogImage } from "@/lib/og";
import { projects } from "@/content/projects";
import { getJobs } from "@/lib/content";
import { hasLocale, locales } from "@/lib/i18n";

// the shared-link picture of each operation and each open position, rendered at build time (any other: 404)

export function generateStaticParams() {
  return locales.flatMap((lang) => [
    ...projects.map((p) => ({ lang, page: "projects", slug: p.slug[lang] })),
    ...getJobs().map((j) => ({ lang, page: "careers", slug: j.slug })),
  ]);
}

export async function GET(_req: Request, { params }: RouteContext<"/og/[lang]/[page]/[slug]">) {
  const { lang, page, slug } = await params;
  const card = hasLocale(lang) ? ogCard(lang, page, slug) : null;
  return card ? ogImage(card) : new Response("Not found", { status: 404 });
}
