"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * The picture published by the group, alone: the indicative stock photograph (with its label)
 * takes its place only if the published one cannot be loaded, so it is never downloaded for
 * nothing nor glimpsed before the real building.
 */
export function PublishedImage({
  src,
  alt,
  placeholder,
  label,
  sizes,
  priority,
  imgClassName,
  tagClassName,
}: {
  src: string;
  alt: string;
  placeholder: string;
  label: string;
  sizes: string;
  priority: boolean;
  imgClassName: string;
  tagClassName: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <>
        <Image src={placeholder} alt="" fill sizes={sizes} className={`object-cover ${imgClassName}`} />
        <span className={`vp-tag absolute z-[1] ${tagClassName}`}>{label}</span>
      </>
    );
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={priority ? "eager" : undefined}
      fetchPriority={priority ? "high" : undefined}
      onError={() => setFailed(true)}
      className={`object-cover ${imgClassName}`}
    />
  );
}
