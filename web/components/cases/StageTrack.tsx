import type { CSSProperties } from "react";
import { Mark } from "@/components/marks/Mark";

type Stage = { label: string; when: string; done: boolean };

/** Where an operation stands: completed phases solid, the following ones outlined. */
export function StageTrack({ stages, doneLabel, plannedLabel, vertical = false, className = "" }: { stages: Stage[]; doneLabel: string; plannedLabel: string; vertical?: boolean; className?: string }) {
  let order = 0;
  return (
    <ol className={`vp-track ${vertical ? "vp-track--v" : ""} ${className}`} style={{ "--n": stages.length } as CSSProperties} data-reveal="fill">
      {stages.map((s, i) => {
        const next = stages[i + 1];
        return (
          <li key={s.label} className="vp-track__item" data-next={next && !next.done ? "planned" : "done"}>
            <Mark kind={s.done ? "solid" : "outline"} order={s.done ? order++ : undefined} />
            <span className="min-w-0">
              <span className="t-small block">{s.label}</span>
              <span className="t-label block">{s.when}</span>
              <span className="sr-only">{s.done ? doneLabel : plannedLabel}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
