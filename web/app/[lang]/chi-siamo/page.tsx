import type { Metadata } from "next";
import { RevealScope } from "@/components/layout/RevealScope";
import { TLink } from "@/components/layout/PageTransition";
import { Chronicle } from "@/components/about/Chronicle";
import { Leadership } from "@/components/about/Leadership";
import { TeamWall } from "@/components/about/TeamWall";
import { Mark } from "@/components/marks/Mark";
import { PageHero } from "@/components/ui/PageHero";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { guamari, production, qualifications, top200 } from "@/content/evidence";
import { projects } from "@/content/projects";
import { company } from "@/content/site";
import { getDictionary, getTeam, newsHref } from "@/lib/content";
import { href } from "@/lib/i18n";
import { alternates, metaText, ogPath, share } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDictionary();
  return { title: t.meta.titles.about, description: metaText(t.meta.aboutDescription), alternates: alternates(lang, "about"), ...share(lang, ogPath(lang, "about")) };
}

const groupAnchor: Record<string, string> = {
  "PROJECT MANAGEMENT & TECHNICAL OFFICE": "technical-office",
  "REAL ESTATE DEPARTMENT": "real-estate",
  "CONDOVI - CONDO MANAGEMENT": "condo-management",
  "V&P CORPORATE TEAM": "corporate",
};

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
  const caseHref = (itSlug: string) => href(lang, "projects", projects.find((p) => p.slug.it === itSlug)?.slug[lang]);
  // each step links to what proves it: the news, the qualifications below, the case
  const proof: Record<string, { href: string; label: string }> = {
    "2021": { href: newsHref(lang, production[0].source.news!), label: a.milestoneLinks.news },
    "2022": { href: newsHref(lang, production[1].source.news!), label: a.milestoneLinks.news },
    "2023": { href: href(lang, "about", undefined, "credentials"), label: a.milestoneLinks.credentials },
    "2024": { href: newsHref(lang, top200.source.news!), label: a.milestoneLinks.news },
    "2025": { href: caseHref("via-asinari-asti"), label: a.milestoneLinks.project },
    "2026": { href: caseHref("palazzo-ex-inps-genova"), label: a.milestoneLinks.project },
  };
  // each year's published figures, each with its source
  const c = a.chronicle;
  const source = (s: { news?: string; label: Record<string, string> }) => ({ label: s.label[lang], href: newsHref(lang, s.news!) });
  const figuresOf = (year: string) => {
    const out: { value: string; unit?: string; label: string; note?: string; source: { label: string; href: string } }[] = [];
    const p = production.find((x) => x.year === year);
    if (p) out.push({ value: p.display[lang], unit: c.million, label: c.productionFigure, note: p.change?.[lang], source: source(p.source) });
    const ri = top200.points.findIndex((x) => x.year === year);
    if (ri >= 0) {
      const r = top200.points[ri];
      const before = top200.points[ri - 1];
      out.push({
        value: `${r.rank}°`,
        label: c.top200Figure,
        note: before ? c.climb.replace("{n}", String(before.rank - r.rank)) : c.of.replace("{n}", String(top200.of)),
        source: source(top200.source),
      });
    }
    const gm = guamari.find((x) => x.year === year);
    if (gm) out.push({ value: `${gm.rank}°`, label: c.guamariFigure, note: c.of.replace("{n}", String(gm.of)), source: source(gm.source) });
    return out;
  };
  // the project of the year, where the step is one
  const pictureOf: Record<string, string> = { "2025": "via-asinari-asti", "2026": "palazzo-ex-inps-genova" };
  const steps = a.milestones.map((m, i) => {
    const figures = figuresOf(m.year);
    const link = proof[m.year];
    const pr = projects.find((x) => x.slug.it === pictureOf[m.year]);
    return {
      ...m,
      figures,
      // the step's own link only when no figure already cites the same page
      link: link && !figures.some((f) => f.source.href === link.href) ? link : undefined,
      image: pr ? { src: pr.image?.src ?? pr.placeholder, alt: "" } : undefined,
      // the founding: the group's symbol in place of a picture
      mark: i === 0,
    };
  });
  const staff = team.filter((gr) => gr.key !== "LEADERSHIP");
  const staffCount = staff.reduce((n, gr) => n + gr.people.length, 0);
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
      <PageHero label={a.label} index={a.since} title={a.title} lead={a.lead} />

      <section data-theme="paper" aria-label={a.label}>
        {/* the group's own photograph, widened at the sides to the page's 21:9; on phones the original frame, so all three stay in */}
        <div className="container-x">
          <div data-reveal="image">
            <ParallaxImage src="/images/pages/about-team-site.jpg" alt="" sizes="100vw" strength={10} className="aspect-[4/3] bg-[var(--line)] sm:aspect-[21/9]" priority />
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
          <div className="mt-16 lg:mt-20">
            <Leadership
              groups={columns.map(({ e, people: ps }) => ({ key: e.key, name: e.name, kind: e.kind, href: e.href || undefined, linkLabel: e.linkLabel, people: ps }))}
              externalNote={t.ui.externalNew}
              labelledBy="leadership-title"
            />
          </div>
        </div>
      </section>

      {/* Six years: the milestones and the figures with their sources, one story */}
      <section data-theme="paper" aria-labelledby="milestones" className="pt-[var(--section-y)]">
        <div className="container-x">
          <p className="t-label mb-5" data-reveal="fade">
            {a.milestonesLabel}
          </p>
          <h2 id="milestones" className="t-l" data-reveal="lines">
            {a.milestonesTitle}
          </h2>
        </div>
        <Chronicle
          steps={steps}
          label={a.milestonesTitle}
          copy={{ production: c.production, ranking: c.ranking, source: c.source, years: c.years }}
          chart={{
            production: production.map((p) => ({ year: p.year, value: p.value, display: p.display[lang] })),
            rank: top200.points,
            of: top200.of,
          }}
        />
      </section>

      {/* The people who work in the group (the leaders are above) */}
      <section data-theme="navy" aria-labelledby="team" className="py-[var(--section-y)]">
        <div className="container-x">
          <p className="t-label mb-5" data-reveal="fade">
            {a.teamLabel}
          </p>
          <h2 id="team" className="t-l mb-12 lg:mb-16" data-reveal="lines">
            {a.teamTitle}
          </h2>
          <TeamWall
            teams={staff.map((gr) => ({
              key: groupAnchor[gr.key] ?? gr.key,
              label: a.groups[gr.key] ?? gr.key,
              count: String(gr.people.length),
              people: gr.people,
            }))}
            copy={{
              all: a.teamAll,
              show: a.teamShow,
              hide: a.teamHide,
              summary: a.teamSummary.replace("{n}", String(staffCount)).replace("{d}", String(staff.length)),
              // the leaders are above, in their own section: counted here, so the figures add up to the opening's
              leaders: a.teamLeaders.replace("{l}", String(leadership.length)),
              careers: { href: href(lang, "careers"), label: a.teamCareers },
            }}
          />
        </div>
      </section>

      {/* External checks */}
      <section id="credentials" data-theme="paper" aria-labelledby="credentials-title" className="py-[var(--section-y)]">
        <div className="container-x grid-12 gap-y-12">
          <div className="col-span-4 lg:col-span-4">
            <p className="t-label mb-5">{a.credentialsLabel}</p>
            <h2 id="credentials-title" className="t-l" data-reveal="lines">
              {a.credentialsTitle}
            </h2>
          </div>
          {/* each check a documented fact (solid mark), its date, and where it can be read */}
          <ul className="vp-index vp-index--short col-span-4 lg:col-span-7 lg:col-start-6">
            {credentials.map((c) => {
              const body = (
                <>
                  <span className="vp-index__lead">
                    <Mark className="vp-index__mark" />
                    {c.title}
                  </span>
                  <span className="vp-index__meta t-label">
                    {c.date} · {c.pdf ? a.pdf : a.news}
                    {c.pdf ? <span className="sr-only"> ({t.ui.externalNew})</span> : null}
                  </span>
                  <span className="vp-index__go" aria-hidden="true">
                    {c.pdf ? "↗" : "→"}
                  </span>
                </>
              );
              return (
                <li key={c.key}>
                  {c.pdf ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className="vp-index__row">
                      {body}
                    </a>
                  ) : (
                    <TLink href={c.href} className="vp-index__row">
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
