"use client";

import ReactDOM from "react-dom";

/**
 * The Adobe Fonts kit @imports Adobe's page-view stylesheet, so the browser only finds it
 * after the kit CSS arrives: two render-blocking requests in a row. Preloading it fetches
 * both in parallel. It is still loaded, as the kit's licence requires.
 * If the kit changes, update the URLs (the @import at the top of the kit's CSS, and the font
 * sources below).
 */
export function PreloadFonts() {
  ReactDOM.preload("https://p.typekit.net/p.css?s=1&k=zgd5zbh&ht=tk&f=14032.14034.14036&a=265650721&app=typekit&e=css", { as: "style" });
  // the two cuts every page shows first (Light for headlines, Regular for text): the kit declares
  // font-display auto, so text waits for them; fetched now rather than after the two stylesheets
  for (const url of FONTS) ReactDOM.preload(url, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return null;
}

/** The woff2 sources of Aktiv Grotesk 300 and 400 in the kit's CSS (update them with the kit). */
const FONTS = [
  "https://use.typekit.net/af/44d038/00000000000000007753ca34/31/l?subset_id=2&fvd=n3&v=3",
  "https://use.typekit.net/af/855c4b/00000000000000007753ca4f/31/l?subset_id=2&fvd=n4&v=3",
];
