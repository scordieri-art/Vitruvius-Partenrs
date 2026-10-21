"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * next/image that removes itself if the file cannot be loaded, so the drawn plate
 * (or the initials of a portrait) placed underneath shows instead of a broken image.
 */
export function SafeImage(props: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through
  return <Image {...props} onError={() => setFailed(true)} />;
}
