import { Button } from "@/components/ui/Button";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { company } from "@/content/site";

/** Closing call to action: one sentence over a quiet photograph, one button and the email. Offices live in the footer. */
export function ContactBand({ label, title, cta, href, image }: { label: string; title: string; cta: string; href: string; image: string }) {
  return (
    <section data-theme="navy" aria-labelledby="contact-band-title" className="relative overflow-hidden">
      <ParallaxImage src={image} alt="" sizes="100vw" strength={10} className="absolute inset-0" imgClassName="opacity-30" />
      <div className="relative container-x grid-12 gap-y-10 py-[clamp(4.5rem,11vw,9.5rem)] lg:items-end">
        <div className="col-span-4 lg:col-span-8">
          <p className="t-label mb-6" data-reveal="fade">
            {label}
          </p>
          <h2 id="contact-band-title" className="t-xl max-w-[13ch]" data-reveal="lines">
            {title}
          </h2>
        </div>
        <div className="col-span-4 flex flex-col items-start gap-4 lg:col-span-4 lg:items-end" data-reveal="fade">
          <Button href={href}>{cta}</Button>
          <a href={`mailto:${company.email}`} className="vp-ulink t-body">
            {company.email}
          </a>
        </div>
      </div>
    </section>
  );
}
