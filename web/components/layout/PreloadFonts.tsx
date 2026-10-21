"use client";

import ReactDOM from "react-dom";

/**
 * The Adobe Fonts kit @imports Adobe's page-view stylesheet, so the browser only finds it
 * after the kit CSS arrives: two render-blocking requests in a row. Preloading it fetches
 * both in parallel. It is still loaded, as the kit's licence requires.
 * If the kit changes, update the URL (it is the @import at the top of the kit's CSS).
 */
export function PreloadFonts() {
  ReactDOM.preload("https://p.typekit.net/p.css?s=1&k=zgd5zbh&ht=tk&f=14032.14034.14036&a=265650721&app=typekit&e=css", { as: "style" });
  return null;
}
