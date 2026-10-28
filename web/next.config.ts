import type { NextConfig } from "next";
import newsIt from "./content/generated/news-it.json";
import newsEn from "./content/generated/news-en.json";
import jobs from "./content/generated/jobs.json";

/** Legacy WordPress URLs → new structure (permanent). */
const legacyRedirects = [
  ...newsIt.map((n) => ({ source: `/${n.slug}`, destination: `/news/${n.slug}`, permanent: true })),
  ...newsEn.map((n) => ({ source: `/en/${n.slug}`, destination: `/en/news/${n.slug}`, permanent: true })),
  ...jobs.map((j) => ({ source: `/jobs/${j.slug}`, destination: `/lavora-con-noi/${j.slug}`, permanent: true })),
  { source: "/current-jobs", destination: "/lavora-con-noi", permanent: true },
  { source: "/category/news", destination: "/news", permanent: true },
  { source: "/en/category/news-en", destination: "/en/news", permanent: true },
  { source: "/pablot", destination: "/news/arte-e-innovazione-nel-2025-con-pablo-t", permanent: true },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // CV uploads: 5 MB file + multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
    // the root layout is in a dynamic segment (app/[lang]): unmatched addresses need app/global-not-found.tsx
    globalNotFound: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return legacyRedirects;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // no framing by other sites (clickjacking), forms post only here, no plugins; scripts and
          // styles are left to the defaults (Adobe Fonts, Vercel), so nothing on the page breaks
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
