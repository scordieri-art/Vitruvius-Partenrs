import { Button } from "@/components/ui/Button";
import { Cta } from "@/components/ui/Cta";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { company } from "@/content/site";

/**
 * Closing call to action: one sentence over a photograph, one large button (an offer of a property,
 * the topic already chosen), then the way to write about anything else and the email. Offices live
 * in the footer. Quiet by default (the photograph faint on navy); vivid on the home page, where the
 * photograph keeps its colour under a navy veil that deepens towards the words.
 */
export function ContactBand({
  label,
  title,
  cta,
  href,
  write,
  image,
  vivid = false,
  n,
}: {
  label: string;
  title: string;
  cta: string;
  href: string;
  write: { label: string; href: string };
  image: string;
  vivid?: boolean;
  /** its number, on the home page, where the sections are numbered */
  n?: number;
}) {
  return (
    <section data-theme="navy" aria-labelledby="contact-band-title" className="relative overflow-hidden">
      <ParallaxImage src={image} alt="" sizes="100vw" strength={10} className="absolute inset-0" imgClassName={vivid ? undefined : "opacity-30"} />
      {vivid ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[rgb(10_35_66/0.66)] lg:bg-transparent lg:bg-[linear-gradient(100deg,rgb(10_35_66/0.88)_0%,rgb(10_35_66/0.6)_45%,rgb(10_35_66/0.32)_100%)]"
        />
      ) : null}
      <div className="relative container-x grid-12 gap-y-10 py-[clamp(4.5rem,11vw,9.5rem)] lg:items-end">
        <div className="col-span-4 lg:col-span-8">
          {n ? (
            <SectionLabel n={n} className="mb-6">
              {label}
            </SectionLabel>
          ) : (
            <p className="t-label mb-6" data-reveal="fade">
              {label}
            </p>
          )}
          <h2 id="contact-band-title" className="t-xl max-w-[13ch]" data-reveal="lines">
            {title}
          </h2>
        </div>
        <div className="col-span-4 flex flex-col items-start gap-7 lg:col-span-4 lg:items-end" data-reveal="fade">
          <Button href={href} size="lg">
            {cta}
          </Button>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Cta href={write.href}>{write.label}</Cta>
            <a href={`mailto:${company.email}`} className="vp-ulink t-body">
              {company.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
