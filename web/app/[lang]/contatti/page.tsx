import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { TLink } from "@/components/layout/PageTransition";
import { ContactForm } from "@/components/forms/ContactForm";
import { Cta } from "@/components/ui/Cta";
import { JumpLink } from "@/components/ui/JumpLink";
import { Mark } from "@/components/marks/Mark";
import { company } from "@/content/site";
import { getDictionary } from "@/lib/content";
import { href } from "@/lib/i18n";
import { alternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDictionary();
  return { title: t.meta.titles.contact, description: t.contactPage.lead, alternates: alternates(lang, "contact") };
}

const maps = (street: string, postal: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Vitruvius & Partners ${street} ${postal}`)}`;

/** Contact: the direct lines first, then the two offices, the form, the company details. */
export default async function ContactPage() {
  const { lang, t } = await getDictionary();
  const c = t.contactPage;

  return (
    <RevealScope>
      {/* Opening: the sentence, the action, the direct lines */}
      <section data-theme="paper" aria-labelledby="contact-title" className="pt-[calc(var(--header-h)+clamp(4rem,12vh,8rem))] pb-[clamp(4rem,8vw,7rem)]">
        <div className="container-x">
          <p className="t-label mb-8" data-reveal="fade">
            {c.label}
          </p>
          <h1 id="contact-title" className="t-xl max-w-[14ch]" data-reveal="lines">
            {c.title}
          </h1>
          <div className="grid-12 mt-10 gap-y-8 lg:mt-14 lg:items-end">
            <p className="t-body-l col-span-4 max-w-[40ch] text-[var(--fg-2)] lg:col-span-5" data-reveal="fade" data-reveal-delay="0.2">
              {c.lead}
            </p>
            <div className="col-span-4 lg:col-span-6 lg:col-start-7 lg:justify-self-end" data-reveal="fade" data-reveal-delay="0.3">
              <JumpLink to="write" primary>
                {c.write}
              </JumpLink>
            </div>
          </div>

          <dl className="mt-[clamp(3.5rem,7vw,6rem)] grid gap-x-[var(--col-gap)] gap-y-8 border-t border-[var(--line)] pt-8 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0 md:col-span-2 xl:col-span-1">
              <dt className="t-label">{c.email}</dt>
              <dd className="t-s mt-2">
                <a className="vp-ulink" href={`mailto:${company.email}`}>
                  {company.email}
                </a>
              </dd>
            </div>
            {company.offices.map((o) => (
              <div key={o.key} className="min-w-0">
                <dt className="t-label">
                  {c.phone} · {o.city}
                </dt>
                <dd className="t-s t-num mt-2">
                  <a className="vp-ulink" href={o.phoneHref}>
                    {o.phone}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Offices */}
      <section data-theme="paper" aria-labelledby="offices-title" className="border-t border-[var(--line)] py-[clamp(4.5rem,9vw,8rem)]">
        <div className="container-x">
          <h2 id="offices-title" className="t-label mb-10">
            {c.offices}
          </h2>
          <div className="grid gap-x-[var(--col-gap)] gap-y-14 md:grid-cols-2">
            {company.offices.map((o) => (
              <address key={o.key} className="flex flex-col not-italic" data-reveal="fade">
                <p className="t-l">{o.city}</p>
                <p className="t-body-l mt-5 text-[var(--fg-2)]">
                  {o.street}
                  <br />
                  {o.postal}
                </p>
                <div className="mt-6">
                  <Cta href={maps(o.street, o.postal)} external externalNote={t.ui.externalNew}>
                    {c.maps}
                  </Cta>
                </div>
              </address>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section data-theme="navy" aria-labelledby="write" className="py-[var(--section-y)]">
        <div className="container-x grid-12 gap-y-12">
          <div className="col-span-4 lg:col-span-4">
            <p className="t-label mb-6">{c.label}</p>
            <h2 id="write" className="t-l" data-reveal="lines">
              {c.write}
            </h2>
            <p className="t-body mt-6 max-w-[34ch] text-[var(--fg-2)]">
              {c.careersNote}{" "}
              <TLink href={href(lang, "careers")} className="vp-ulink text-[var(--fg)]">
                {t.meta.titles.careers}
              </TLink>
              {c.careersNoteEnd}
            </p>
            {/* who answers: four published facts, the same ones the About page sources */}
            <div className="mt-12 lg:mt-16">
              <h3 className="t-label mb-4">{c.proofs.label}</h3>
              <dl className="grid grid-cols-2 gap-x-[var(--col-gap)] border-t border-[var(--line)] lg:grid-cols-1">
                {c.proofs.items.map((p) => (
                  <div key={p.value} className="border-b border-[var(--line)] py-4">
                    <dt className="flex items-baseline gap-2.5">
                      <Mark className="text-[var(--fg)]" />
                      <span className="t-s t-num leading-none">{p.value}</span>
                    </dt>
                    <dd className="t-small mt-2 text-[var(--fg-2)]">{p.label}</dd>
                  </div>
                ))}
              </dl>
              <TLink href={href(lang, "about", undefined, "credentials")} className="vp-ulink t-small mt-4 inline-block text-[var(--fg)]">
                {t.home.numbers.source}
              </TLink>
            </div>
          </div>
          <div className="col-span-4 lg:col-span-7 lg:col-start-6">
            <ContactForm labels={c.form} />
          </div>
        </div>
      </section>

      {/* Company details */}
      <section data-theme="paper" aria-labelledby="company-title" className="py-[clamp(3.5rem,7vw,6rem)]">
        <div className="container-x grid-12 gap-y-8">
          <h2 id="company-title" className="t-label col-span-4 lg:col-span-3">
            {c.company}
          </h2>
          <dl className="col-span-4 grid grid-cols-2 gap-x-[var(--col-gap)] gap-y-6 lg:col-span-9 lg:grid-cols-4">
            {[
              { k: c.name, v: company.legalName },
              { k: c.vat, v: company.vat },
              { k: c.capital, v: company.shareCapital },
            ].map((f) => (
              <div key={f.k} className="min-w-0 border-t border-[var(--line)] pt-4">
                <dt className="t-label">{f.k}</dt>
                <dd className="t-small t-num mt-1">{f.v}</dd>
              </div>
            ))}
            <div className="col-span-2 min-w-0 border-t border-[var(--line)] pt-4 lg:col-span-1">
              <dt className="t-label">{c.pec}</dt>
              <dd className="t-small mt-1">
                <a className="vp-ulink" href={`mailto:${company.pec}`}>
                  {company.pec}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </RevealScope>
  );
}
