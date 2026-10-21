import { TLink } from "@/components/layout/PageTransition";

type Job = { slug: string; title: string; location: string; type: string; href: string };

/** Open positions: on hover (or focus) a navy band sweeps in along the slope of the symbol. */
export function JobList({ jobs, size = "t-m" }: { jobs: Job[]; size?: string }) {
  return (
    <ul className="border-t border-[var(--line)]">
      {jobs.map((j) => (
        <li key={j.slug}>
          <TLink href={j.href} className="vp-job" transitionLabel={j.title}>
            <span aria-hidden="true" className="vp-job__fill" />
            <span className="vp-job__text min-w-0">
              <span className={`${size} block`}>{j.title}</span>
              <span className="vp-job__meta t-small mt-2 block">
                {j.location} · {j.type}
              </span>
            </span>
            <span aria-hidden="true" className="vp-job__go">
              →
            </span>
          </TLink>
        </li>
      ))}
    </ul>
  );
}
