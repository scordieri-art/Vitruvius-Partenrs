"use client";

import Image from "next/image";
import { useState } from "react";
import { Mark } from "@/components/marks/Mark";

type Person = { name: string; role: string; photo?: string | null };
type Group = { key: string; name: string; kind: string; href?: string; linkLabel?: string; people: Person[] };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/**
 * Who leads the group. On wide screens: the names, large, under the company they lead, and
 * beside them one portrait that stays in view; pointing at a name (or reaching it with the
 * keyboard) opens that person's portrait along the slope of the symbol, and the small chart of
 * the group above lights the branch they belong to. On phones each name carries its portrait.
 * The list holds everything (names, roles, companies); the portrait stage repeats it for the eye.
 */
export function Leadership({ groups, externalNote }: { groups: Group[]; externalNote: string }) {
  const people = groups.flatMap((g) => g.people.map((p) => ({ ...p, group: g })));
  const [active, setActive] = useState(0);
  const [under, setUnder] = useState<number | null>(null);
  const pick = (i: number) => {
    if (i === active) return;
    setUnder(active);
    setActive(i);
  };
  const lead = people[active];
  const two = (n: number) => String(n).padStart(2, "0");
  let n = 0;

  return (
    <div className="vp-lead grid-12 gap-y-14" data-group={lead.group.key}>
      <div className="col-span-4 lg:col-span-6">
        {/* the group in one line: the holding and its two divisions, the active branch lit */}
        <div className="vp-lead__tree" aria-hidden="true">
          <span className="vp-lead__node" data-node={groups[0]?.key}>
            {groups[0]?.name}
          </span>
          <svg className="vp-lead__links" viewBox="0 0 48 64" preserveAspectRatio="none">
            <path data-link={groups[1]?.key} d="M0 32 H20 V12 H48" />
            <path data-link={groups[2]?.key} d="M0 32 H20 V52 H48" />
          </svg>
          <span className="vp-lead__branches">
            {groups.slice(1).map((g) => (
              <span key={g.key} className="vp-lead__node" data-node={g.key}>
                {g.name}
              </span>
            ))}
          </span>
        </div>

        {groups.map((g) => (
          <div key={g.key} className="vp-lead__group">
            <p className="vp-lead__entity">
              <span className="t-label">{g.kind}</span>
              <span className="t-small">{g.name}</span>
            </p>
            <ul>
              {g.people.map((p) => {
                const i = n++;
                return (
                  <li key={p.name}>
                    <button
                      type="button"
                      className="vp-lead__person"
                      aria-pressed={i === active}
                      onPointerEnter={() => pick(i)}
                      onFocus={() => pick(i)}
                      onClick={() => pick(i)}
                    >
                      <span className="vp-lead__thumb" aria-hidden="true">
                        <span className="vp-lead__initials">{initials(p.name)}</span>
                        {p.photo ? <Image src={p.photo} alt="" fill sizes="4rem" className="object-cover object-[50%_20%]" /> : null}
                      </span>
                      <Mark className="vp-lead__mark" />
                      <span className="vp-lead__name">{p.name}</span>
                      <span className="vp-lead__role t-label">{p.role}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {g.href ? (
              <a href={g.href} target="_blank" rel="noopener noreferrer" className="vp-ulink t-small mt-5 inline-block">
                {g.linkLabel} <span aria-hidden="true">↗</span>
                <span className="sr-only"> ({externalNote})</span>
              </a>
            ) : null}
          </div>
        ))}
      </div>

      {/* the portrait stage: wide screens only, a visual echo of the list */}
      <div className="hidden lg:col-span-5 lg:col-start-8 lg:block">
        <div className="vp-lead__stage" aria-hidden="true">
          {people.map((p, i) => (
            <div key={p.name} className="vp-lead__portrait" data-state={i === active ? "in" : i === under ? "under" : undefined}>
              <span className="vp-lead__initials vp-lead__initials--big">{initials(p.name)}</span>
              {p.photo ? <Image src={p.photo} alt="" fill sizes="(min-width: 1024px) 40vw, 1px" className="object-cover object-[50%_20%]" /> : null}
            </div>
          ))}
          <div className="vp-lead__shade" />
          <p className="vp-lead__count t-label t-num">
            {two(active + 1)} / {two(people.length)}
          </p>
          <div key={active} className="vp-lead__caption">
            <p className="t-m">{lead.name}</p>
            <p className="t-small mt-1 text-white/75">
              {lead.role} · {lead.group.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
