import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { TLink } from "@/components/layout/PageTransition";
import { Growth } from "@/components/about/Growth";
import { Timeline } from "@/components/about/Timeline";
import { TeamTabs } from "@/components/about/TeamTabs";
import { Mark } from "@/components/marks/Mark";
import { PageHero } from "@/components/ui/PageHero";
import { SafeImage } from "@/components/ui/SafeImage";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { guamari, qualifications, top200 } from "@/content/evidence";
import { company } from "@/content/site";
import { getDictionary, getTeam, newsHref } from "@/lib/content";
import { alternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDictionary();
  return { title: t.meta.titles.about, description: t.meta.aboutDescription, alternates: alternates(lang, "about") };
}

const groupAnchor: Record<string, string> = {
  LEADERSHIP: "leadership",
  "PROJECT MANAGEMENT & TECHNICAL OFFICE": "technical-office",
  "REAL ESTATE DEPARTMENT": "real-estate",
  "CONDOVI - CONDO MANAGEMENT": "condo-management",
  "V&P CORPORATE TEAM": "corporate",
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export default async function AboutPage() {
  const { lang, t } = await getDictionary();
  const a = t.about;
  const g = t.group;
  const team = getTeam();
  const people = team.reduce((n, gr) => n + gr.people.length, 0);
  const leadership = team.find((gr) => gr.key === "LEADERSHIP")?.people ?? [];
  const [vp, construction, living] = g.entities;
  const leadsOf = (unit: string | null) => leadership.filter((p) => (p.unit ?? null) === unit);
  const columns = [
    { e: vp, people: leadsOf(null) },
    { e: construction, people: leadsOf("Vitruvius Construction") },
    { e: living, people: leadsOf("Vitruvius Living") },
  ];
  const credentials = [
    ...qualifications.map((q) => ({
      key: q.name,
      title: q.name,
      date: q.date[lang],
      href: q.link.kind === "pdf" ? company.certifications[q.link.key] : newsHref(lang, q.link.news),
      pdf: q.link.kind === "pdf",
    })),
    { key: "top200", title: `Top 200 · ${g.rank(top200.points[1].rank)}`, date: top200.points[1].year, href: newsHref(lang, top200.source.news!), pdf: false },
    ...guamari
      .slice()
      .reverse()
      .map((x) => ({ key: `guamari-${x.year}`, title: `Guamari · ${g.rankOf(x.rank, x.of)}`, date: x.year, href: newsHref(lang, x.source.news!), pdf: false })),
  ];

  return (
    <RevealScope>
      <PageHero label={a.label} title={a.title} lead={a.lead} />

      <section data-theme="paper" aria-label={a.label}>
        <div className="container-x">
          <div data-reveal="image">
            <ParallaxImage src="/images/placeholder/texture-grey-triangular-panels-01.jpg" alt="" sizes="100vw" strength={10} className="aspect-[4/5] bg-[var(--line)] sm:aspect-[21/9]" />
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-x-[var(--col-gap)] gap-y-2 md:grid-cols-3 lg:grid-cols-5">
            {[
              { k: a.facts.founded, v: "2020" },
              { k: a.facts.offices, v: company.offices.map((o) => o.city).join(" · ") },
              { k: a.facts.people, v: String(people) },
              { k: a.facts.qualifications, v: a.facts.qualificationsValue },
              { k: a.facts.ranking, v: g.rank(top200.points[1].rank) },
            ].map((f) => (
              // two rows shared across the line: a value that wraps lifts its row, the labels stay aligned
              <div key={f.k} className="row-span-2 mb-6 grid min-w-0 grid-rows-subgrid border-t border-[var(--line)] pt-5" data-reveal="fade">
                <dt className="t-label row-start-2">{f.k}</dt>
                <dd className="t-s t-num row-start-1 self-end [overflow-wrap:anywhere]">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Who leads what */}
      <section data-theme="navy" aria-labelledby="leadership-title" className="mt-[var(--section-y)] py-[var(--section-y)]">
        <div className="container-x">
          <p className="t-label mb-5" data-reveal="fade">
            {a.leadershipLabel}
          </p>
          <h2 id="leadership-title" className="t-l" data-reveal="lines">
            {a.leadershipTitle}
          </h2>
          <div className="mt-16 grid gap-x-[var(--col-gap)] gap-y-14 lg:mt-20 lg:grid-cols-3">
            {columns.map(({ e, people: ps }) => (
              <div key={e.key} className="flex flex-col border-t border-[var(--line)] pt-6" data-reveal="fade">
                <p className="t-label">{e.kind}</p>
                <p className="t-m mt-2">{e.name}</p>
                <ul className="mt-8 grid gap-4">
                  {ps.map((p) => (
                    <li key={p.name} className="flex items-baseline gap-3">
                      <Mark className="translate-y-[0.06em]" />
                      <span>
                        <span className="t-body block">{p.name}</span>
                        <span className="t-label block">{p.role}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {e.href ? (
                  <a href={e.href} target="_blank" rel="noopener noreferrer" className="vp-ulink t-small mt-8 self-start">
                    {e.linkLabel} <span aria-hidden="true">↗</span>
                    <span className="sr-only"> ({t.ui.externalNew})</span>
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section data-theme="paper" aria-labelledby="milestones" className="py-[var(--section-y)]">
        <div className="container-x">
          <p className="t-label mb-5" data-reveal="fade">
            {a.milestonesLabel}
          </p>
          <h2 id="milestones" className="t-l mb-14" data-reveal="lines">
            {a.milestonesTitle}
          </h2>
          <Timeline items={a.milestones} prev={t.ui.previous} next={t.ui.next} hint={a.dragHint} />
        </div>
      </section>

      {/* Growth, in two charts */}
      <section data-theme="paper" aria-labelledby="growth-title" className="border-t border-[var(--line)] py-[var(--section-y)]">
        <div className="container-x">
          <p className="t-label mb-5" data-reveal="fade">
            {a.growthLabel}
          </p>
          <h2 id="growth-title" className="t-l mb-4" data-reveal="lines">
            {a.growthTitle}
          </h2>
          <Growth lang={lang} copy={a.growth} />
        </div>
      </section>

      {/* Team */}
      <section data-theme="paper" aria-labelledby="team" className="border-t border-[var(--line)] py-[var(--section-y)]">
        <div className="container-x">
          <p className="t-label mb-5" data-reveal="fade">
            {a.teamLabel}
          </p>
          <h2 id="team" className="t-l mb-12" data-reveal="lines">
            {a.teamTitle}
          </h2>
          <TeamTabs
            label={a.teamLabel}
            tabs={team.map((gr) => ({
              key: groupAnchor[gr.key] ?? gr.key,
              label: a.groups[gr.key] ?? gr.key,
              count: gr.people.length,
              panel: (
                <ul className="grid grid-cols-2 gap-x-[var(--col-gap)] gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
                  {gr.people.map((p) => (
                    <li key={p.name} className="group">
                      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--line)]">
                        <span aria-hidden="true" className="t-m absolute inset-0 grid place-items-center text-[var(--fg-2)]">
                          {initials(p.name)}
                        </span>
                        {p.photo ? (
                          <SafeImage
                            src={p.photo}
                            alt=""
                            data-kind="portrait"
                            fill
                            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 46vw"
                            className="object-cover grayscale transition-[filter,transform] duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                          />
                        ) : null}
                      </div>
                      <p className="t-body mt-3 leading-tight">{p.name}</p>
                      <p className="t-label mt-1">
                        {p.role}
                        {p.unit ? ` · ${p.unit}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ),
            }))}
          />
        </div>
      </section>

      {/* External checks */}
      <section id="credentials" data-theme="paper" aria-labelledby="credentials-title" className="border-t border-[var(--line)] py-[var(--section-y)]">
        <div className="container-x grid-12 gap-y-12">
          <div className="col-span-4 lg:col-span-4">
            <p className="t-label mb-5">{a.credentialsLabel}</p>
            <h2 id="credentials-title" className="t-l" data-reveal="lines">
              {a.credentialsTitle}
            </h2>
          </div>
          <ul className="col-span-4 border-t border-[var(--line)] lg:col-span-7 lg:col-start-6">
            {credentials.map((c) => {
              const body = (
                <>
                  <span className="t-s min-w-0">{c.title}</span>
                  <span className="t-label shrink-0 sm:text-right">
                    {c.date} · {c.pdf ? `${a.pdf} ↗` : a.news}
                    {c.pdf ? <span className="sr-only"> ({t.ui.externalNew})</span> : null}
                  </span>
                </>
              );
              return (
                <li key={c.key} className="border-b border-[var(--line)]">
                  {c.pdf ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      {body}
                    </a>
                  ) : (
                    <TLink href={c.href} className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      {body}
                    </TLink>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </RevealScope>
  );
}
