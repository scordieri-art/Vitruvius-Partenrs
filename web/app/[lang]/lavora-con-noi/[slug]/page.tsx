import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { notFound } from "next/navigation";
import { TLink } from "@/components/layout/PageTransition";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import { StickyAction } from "@/components/ui/StickyAction";
import { DashTitle } from "@/components/careers/DashTitle";
import { JobList } from "@/components/careers/JobList";
import { JumpLink } from "@/components/ui/JumpLink";
import { Mark } from "@/components/marks/Mark";
import { jobFacts } from "@/content/jobFacts";
import { getDictionary, getJobs, outline } from "@/lib/content";
import { formatDate, href, locales } from "@/lib/i18n";
import { alternates, metaText, metaTitle, ogPath, share } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((lang) => getJobs().map((j) => ({ lang, slug: j.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/lavora-con-noi/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { lang, t } = await getDictionary();
  const job = getJobs().find((j) => j.slug === slug);
  if (!job) return {};
  return {
    title: metaTitle(`${job.title} — ${t.meta.titles.careers}`),
    description: metaText(job.html),
    alternates: alternates(lang, "careers", { it: job.slug, en: job.slug }),
    ...share(lang, ogPath(lang, "careers", job.slug)),
  };
}

/** A position: what it is at a glance, the description with its details, how to apply, the form, the other positions. */
export default async function JobPage({ params }: PageProps<"/[lang]/lavora-con-noi/[slug]">) {
  const { slug } = await params;
  const { lang, t } = await getDictionary();
  const jobs = getJobs();
  const job = jobs.find((j) => j.slug === slug);
  if (!job) notFound();
  const c = t.careersPage;
  const facts = jobFacts[job.slug];
  // the curated facts when the posting has them; otherwise its own published details, less the
  // internal category (“Ampliamento Organico”), which tells a candidate nothing
  const rows = facts
    ? (["contract", "duration", "hours", "experience"] as const).filter((k) => facts[k]).map((k) => ({ label: c.glance[k], value: facts[k]![lang], lang }))
    : job.specs.filter((s) => !/categoria/i.test(s.label)).map((s) => ({ ...s, lang: "it" as const }));
  const others = jobs.filter((j) => j.slug !== job.slug).map((j) => ({ slug: j.slug, title: j.title, location: j.location, type: j.type, href: href(lang, "careers", j.slug) }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.html,
    datePosted: job.updated,
    employmentType: /stage/i.test(job.type) ? "INTERN" : "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: "Vitruvius & Partners", sameAs: "https://vitruviusandpartners.com" },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "IT" } },
  };

  return (
    <RevealScope>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* At a glance */}
      <header data-theme="paper" className="pt-[calc(var(--header-h)+clamp(4rem,12vh,8rem))] pb-[clamp(3.5rem,7vw,6rem)]">
        <div className="container-x">
          <p className="t-label mb-8 flex items-center gap-3" data-reveal="fade">
            <TLink href={href(lang, "careers")} className="vp-ulink">
              {c.label}
            </TLink>
            <span aria-hidden="true" className="h-px w-10 bg-current opacity-40" />
            <span>{c.openLabel}</span>
          </p>
          <h1 className="t-xl max-w-[16ch]" data-reveal="lines">
            <DashTitle text={job.title} />
          </h1>
          <div className="mt-12 flex flex-col items-start gap-10 border-t border-[var(--line)] pt-8 lg:flex-row lg:items-end lg:justify-between" data-reveal="fade" data-reveal-delay="0.2">
            <dl className="grid grid-cols-2 gap-x-[var(--col-gap)] gap-y-6 sm:grid-cols-3 sm:gap-x-12">
              <div>
                <dt className="t-label">{c.jobMeta.location}</dt>
                <dd className="t-body-l mt-1">{job.location}</dd>
              </div>
              <div>
                <dt className="t-label">{c.jobMeta.type}</dt>
                <dd lang="it" className="t-body-l mt-1">
                  {job.type}
                </dd>
              </div>
              <div>
                <dt className="t-label">{c.jobMeta.updated}</dt>
                <dd className="t-body-l t-num mt-1">
                  <time dateTime={job.updated}>{formatDate(job.updated, lang)}</time>
                </dd>
              </div>
            </dl>
            <JumpLink to="candidatura" primary>
              {c.apply}
            </JumpLink>
          </div>
          {c.italianOnly ? <p className="t-small mt-6 text-[var(--fg-2)]">{c.italianOnly}</p> : null}
        </div>
      </header>

      {/* The position */}
      <section data-theme="paper" aria-label={job.title} className="border-t border-[var(--line)] py-[clamp(4rem,9vw,8rem)]">
        <div className="container-x grid-12 gap-y-16">
          <aside className="col-span-4 lg:col-span-4 lg:col-start-9 lg:row-start-1">
            {/* the position at a glance: contract, hours, what comes with it, then the way in;
                first on phones, beside the text on wide screens */}
            <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
              <p className="t-label mb-4">{facts ? c.glance.title : c.specs}</p>
              <dl className="border-t border-[var(--line)]">
                {rows.map((r) => (
                  <div key={r.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b border-[var(--line)] py-4">
                    <dt className="t-label">{r.label}</dt>
                    <dd lang={r.lang} className="t-small">
                      {r.value}
                    </dd>
                  </div>
                ))}
                {facts?.offer?.length ? (
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b border-[var(--line)] py-4">
                    <dt className="t-label">{c.glance.offer}</dt>
                    <dd>
                      <ul className="grid gap-1.5">
                        {facts.offer.map((o) => (
                          <li key={o.it} className="t-small flex items-baseline gap-2">
                            <Mark className="h-[0.6rem] shrink-0 translate-y-[0.02em]" />
                            {o[lang]}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ) : null}
              </dl>
              {/* on phones the opening's button is just above */}
              <div className="mt-8 hidden lg:block">
                <JumpLink to="candidatura" primary>
                  {c.apply}
                </JumpLink>
              </div>
            </div>
          </aside>
          <div lang="it" className="prose-vp col-span-4 lg:col-span-7 lg:col-start-1 lg:row-start-1" dangerouslySetInnerHTML={{ __html: outline(job.html) }} />
        </div>
      </section>

      {/* phones: the way to apply at hand while reading, until the form comes into view */}
      <StickyAction href="#candidatura" until="#candidatura">
        {c.apply}
      </StickyAction>

      {/* How to apply and the form */}
      <section id="candidatura" data-theme="navy" aria-labelledby="apply-title" className="py-[var(--section-y)]">
        <div className="container-x grid-12 gap-y-14">
          <div className="col-span-4 lg:col-span-4">
            <p className="t-label mb-8">{c.stepsTitle}</p>
            <ol className="grid gap-6">
              {c.steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-t border-[var(--line)] pt-4">
                  <span className="t-label t-num">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="t-body block">{s.title}</span>
                    <span className="t-small mt-1 block text-[var(--fg-2)]">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="col-span-4 lg:col-span-7 lg:col-start-6">
            <ApplicationForm job={job.title} labels={c.form} />
          </div>
        </div>
      </section>

      {/* Other positions */}
      {others.length ? (
        <section data-theme="paper" aria-labelledby="others-title" className="py-[clamp(4.5rem,9vw,8rem)]">
          <div className="container-x grid-12 gap-y-10">
            <h2 id="others-title" className="t-l col-span-4 lg:col-span-4" data-reveal="lines">
              {c.others}
            </h2>
            <div className="col-span-4 lg:col-span-8 lg:col-start-5">
              <JobList jobs={others} />
            </div>
          </div>
        </section>
      ) : null}
    </RevealScope>
  );
}
