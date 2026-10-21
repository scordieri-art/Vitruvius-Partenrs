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
    remotePatterns: [{ protocol: "https", hostname: "vitruviusandpartners.com", pathname: "/wp-content/uploads/**" }],
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
        ],
      },
    ];
  },
};

export default nextConfig;
