import type { CSSProperties } from "react";
import Image from "next/image";
import { PublishedImage } from "./PublishedImage";
import type { Project } from "@/content/projects";
import type { Locale } from "@/lib/i18n";

/**
 * A project's picture: the image published by the group; where there is none, or it cannot
 * load, an indicative stock photograph that carries its own "indicative image" label, so a
 * stock photo is never passed off as the project.
 */
export function ProjectImage({
  p,
  lang,
  label,
  sizes,
  priority = false,
  className = "",
  imgClassName = "",
  tagClassName = "right-3 top-3",
  style,
}: {
  p: Project;
  lang: Locale;
  label: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  tagClassName?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`relative overflow-hidden bg-[var(--line)] ${className}`} style={style}>
      {p.image ? (
        <PublishedImage
          src={p.image.src}
          alt={p.image.alt[lang]}
          placeholder={p.placeholder}
          label={label}
          sizes={sizes}
          priority={priority}
          imgClassName={imgClassName}
          tagClassName={tagClassName}
        />
      ) : (
        <>
          {/* no published picture: the stock photograph, always labelled */}
          <Image
            src={p.placeholder}
            alt=""
            fill
            sizes={sizes}
            loading={priority ? "eager" : undefined}
            fetchPriority={priority ? "high" : undefined}
            className={`object-cover ${imgClassName}`}
          />
          <span className={`vp-tag absolute z-[1] ${tagClassName}`}>{label}</span>
        </>
      )}
    </div>
  );
}
