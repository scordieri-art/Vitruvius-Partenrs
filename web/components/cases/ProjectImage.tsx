import Image from "next/image";
import { SafeImage } from "@/components/ui/SafeImage";
import type { Project } from "@/content/projects";
import type { Locale } from "@/lib/i18n";

/**
 * A project's picture: the image published by the group, over an indicative stock
 * photograph that carries its own "indicative image" label. Where the published image
 * cannot load, the label stays visible, so a stock photo is never passed off as the project.
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
  hoverLabel,
}: {
  p: Project;
  lang: Locale;
  label: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  tagClassName?: string;
  /** shown on a navy band that sweeps in on hover of the enclosing .group link */
  hoverLabel?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-[var(--line)] ${className}`}>
      {/* the stock photograph is the visible picture only when no published one exists */}
      <Image
        src={p.placeholder}
        alt=""
        fill
        sizes={sizes}
        loading={priority && !p.image ? "eager" : undefined}
        fetchPriority={priority && !p.image ? "high" : undefined}
        className={`object-cover ${imgClassName}`}
      />
      <span className={`vp-tag absolute z-[1] ${tagClassName}`}>{label}</span>
      {p.image ? (
        <SafeImage
          src={p.image.src}
          alt={p.image.alt[lang]}
          fill
          sizes={sizes}
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          className={`z-[2] object-cover ${imgClassName}`}
        />
      ) : null}
      {hoverLabel ? (
        <span className="vp-sweep" aria-hidden="true">
          <span className="vp-sweep__label t-s">
            {hoverLabel} <span aria-hidden="true">→</span>
          </span>
        </span>
      ) : null}
    </div>
  );
}
