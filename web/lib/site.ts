import { company } from "@/content/site";

/**
 * The site's public address, for canonical links, the sitemap and shared-link pictures:
 * the project's production domain on Vercel (its vercel.app address today, the group's own
 * domain as soon as it is attached), the group's domain anywhere else.
 */
export const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : company.url;

/** Hosts that may be indexed by search engines: the group's own domain only. */
const ownHost = new URL(company.url).hostname.replace(/^www\./, "");
export const indexable = (host: string | null) => !!host && host.replace(/^www\./, "").split(":")[0] === ownHost;
