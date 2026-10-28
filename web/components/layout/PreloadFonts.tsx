"use client";

import ReactDOM from "react-dom";
import { FONT_KIT } from "@/lib/fonts";

/**
 * The Adobe Fonts kit is attached by a script (see the layout), which the browser finds late, and it
 * @imports Adobe's page-view stylesheet, found later still: preloading both fetches them at once,
 * with the HTML. The page-view stylesheet is still loaded, as the kit's licence requires.
 * If the kit changes, update the URLs (the @import at the top of the kit's CSS, and the font
 * sources below).
 */
export function PreloadFonts() {
  ReactDOM.preload(FONT_KIT, { as: "style" });
  ReactDOM.preload("https://p.typekit.net/p.css?s=1&k=zgd5zbh&ht=tk&f=14032.14034.14036&a=265650721&app=typekit&e=css", { as: "style" });
  // the two cuts every page shows first (Light for headlines, Regular for text), fetched now rather
  // than after the two stylesheets: they are usually there before the kit, so the change from the
  // fallback face happens at once (the kit declares font-display auto: a face still loading when the
  // kit arrives would hide its text for a moment)
  for (const url of FONTS) ReactDOM.preload(url, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return null;
}

/** The woff2 sources of Aktiv Grotesk 300 and 400 in the kit's CSS (update them with the kit). */
const FONTS = [
  "https://use.typekit.net/af/44d038/00000000000000007753ca34/31/l?subset_id=2&fvd=n3&v=3",
  "https://use.typekit.net/af/855c4b/00000000000000007753ca4f/31/l?subset_id=2&fvd=n4&v=3",
];
