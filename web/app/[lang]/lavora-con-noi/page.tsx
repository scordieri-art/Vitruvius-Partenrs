import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { JobList } from "@/components/careers/JobList";
import { Cta } from "@/components/ui/Cta";
import { JumpLink } from "@/components/ui/JumpLink";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { company } from "@/content/site";
import { getDictionary, getJobs, getTeam } from "@/lib/content";
import { href } from "@/lib/i18n";
import { alternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDictionary();
  return { title: t.meta.titles.careers, description: t.careersPage.lead, alternates: alternates(lang, "careers") };
}

/** Careers: the promise and a photograph, the team in figures, the open positions, how to apply. */
export default async function CareersPage() {
  const { lang, t } = await getDictionary();
  const c = t.careersPage;
  const jobs = getJobs().map((j) => ({ slug: j.slug, title: j.title, location: j.location, type: j.type, href: href(lang, "careers", j.slug) }));
  const people = getTeam().reduce((n, g) => n + g.people.length, 0);
  const facts = [
    { v: String(people), k: c.facts.people },
    { v: String(company.offices.length), k: c.facts.offices },
    { v: "30+", k: c.facts.cities },
  ];

  return (
    <RevealScope>
      {/* Opening */}
      <section data-theme="paper" aria-labelledby="careers-title" className="pt-[calc(var(--header-h)+clamp(4rem,12vh,8rem))] pb-[clamp(4rem,9vw,7rem)]">
        <div className="container-x grid-12 gap-y-12 lg:items-end">
          <div className="col-span-4 lg:col-span-7">
            <p className="t-label mb-8" data-reveal="fade">
              {c.label}
            </p>
            <h1 id="careers-title" className="t-xl max-w-[14ch]" data-reveal="lines">
              {c.title}
            </h1>
            <p className="t-body-l mt-10 max-w-[44ch] text-[var(--fg-2)]" data-reveal="fade" data-reveal-delay="0.2">
              {c.lead}
            </p>
            {jobs.length ? (
              <div className="mt-10" data-reveal="fade" data-reveal-delay="0.3">
                <JumpLink to="positions" primary>
                  {c.openLabel} <span className="t-num opacity-70">· {jobs.length}</span>
                </JumpLink>
              </div>
            ) : null}
          </div>
          <div className="col-span-4 lg:col-span-4 lg:col-start-9" data-reveal="image">
            <ParallaxImage src="/images/placeholder/careers-plans-hands-02.jpg" alt="" sizes="(min-width: 1024px) 33vw, 100vw" className="aspect-[4/5] bg-[var(--line)]" priority />
          </div>
        </div>
      </section>

      {/* The team, over a photograph of a site */}
      <section data-theme="ink" aria-label={c.facts.people} className="relative overflow-hidden">
        <ParallaxImage src="/images/placeholder/careers-team-site-01.jpg" alt="" sizes="100vw" strength={10} className="absolute inset-0" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgb(15_23_42/0.85),rgb(15_23_42/0.25)_60%,rgb(15_23_42/0.1))]" />
        <div className="relative container-x flex min-h-[max(80svh,32rem)] flex-col justify-end pb-[clamp(3rem,8vh,6rem)]">
          <dl className="grid grid-cols-3 gap-x-[var(--col-gap)] gap-y-8 border-t border-white/25 pt-8">
            {facts.map((f) => (
              <div key={f.k} className="flex flex-col" data-reveal="fade">
                <dt className="t-small order-2 mt-2 text-white/75">{f.k}</dt>
                <dd className="vp-count t-num order-1 text-white">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Open positions */}
      <section id="positions" data-theme="paper" aria-labelledby="positions-title" className="py-[var(--section-y)]">
        <div className="container-x grid-12 gap-y-12">
          <div className="col-span-4 lg:col-span-4">
            <p className="t-label mb-5" data-reveal="fade">
              {t.home.careers.count(jobs.length)}
            </p>
            <h2 id="positions-title" className="t-l" data-reveal="lines">
              {c.openLabel}
            </h2>
          </div>
          <div className="col-span-4 lg:col-span-8 lg:col-start-5" data-reveal="fade">
            {jobs.length ? <JobList jobs={jobs} /> : <p className="t-body-l">{c.none}</p>}
          </div>
        </div>
      </section>

      {/* How to apply */}
      <section data-theme="paper" aria-labelledby="apply-title" className="border-t border-[var(--line)] py-[clamp(4.5rem,10vw,9rem)]">
        <div className="container-x">
          <h2 id="apply-title" className="t-label mb-10">
            {c.stepsTitle}
          </h2>
          <ol className="grid gap-x-[var(--col-gap)] gap-y-12 md:grid-cols-3">
            {c.steps.map((s, i) => (
              <li key={s.title} className="border-t border-[var(--line)] pt-6" data-reveal="fade" data-reveal-delay={String(i * 0.1)}>
                <p className="t-xl t-num text-[var(--fg-2)]">{String(i + 1).padStart(2, "0")}</p>
                <p className="t-s mt-6">{s.title}</p>
                <p className="t-body mt-2 max-w-[32ch] text-[var(--fg-2)]">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* LinkedIn */}
      <section data-theme="navy" aria-labelledby="linkedin-title" className="py-[clamp(4.5rem,10vw,8rem)]">
        <div className="container-x flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <h2 id="linkedin-title" className="t-l max-w-[18ch]" data-reveal="lines">
            {c.linkedinTitle}
          </h2>
          <Cta href={company.social.linkedin} external externalNote={t.ui.externalNew}>
            LinkedIn
          </Cta>
        </div>
      </section>
    </RevealScope>
  );
}
