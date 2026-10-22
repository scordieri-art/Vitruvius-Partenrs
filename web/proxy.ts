import { NextResponse, type NextRequest } from "next/server";
import { enToInternal, internalToEn } from "./lib/i18n";
import { indexable } from "./lib/site";

/**
 * Locale routing.
 * - Italian is served without prefix: "/chi-siamo" → internal "/it/chi-siamo".
 * - English lives under "/en" with English slugs: "/en/about-us" → internal "/en/chi-siamo".
 * - "/it/..." and "/en/<italian-slug>" redirect to their canonical public URL.
 * Pages served from any host but the group's own domain (vercel.app, branch previews) ask
 * search engines not to index them, so the copy under test never competes with the real site.
 */
export function proxy(request: NextRequest) {
  const response = route(request);
  if (!indexable(request.headers.get("host"))) response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

function route(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/it" || pathname.startsWith("/it/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const [, , first, ...rest] = pathname.split("/");
    if (first && internalToEn[first]) {
      const url = request.nextUrl.clone();
      url.pathname = ["/en", internalToEn[first], ...rest].join("/");
      return NextResponse.redirect(url, 308);
    }
    if (first && enToInternal[first]) {
      const url = request.nextUrl.clone();
      url.pathname = ["/en", enToInternal[first], ...rest].join("/");
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/it${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next|api|og/|images|brand|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
