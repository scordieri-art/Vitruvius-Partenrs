"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { TLink } from "@/components/layout/PageTransition";

type Person = { name: string; role: string; unit?: string | null; photo?: string | null };
type Team = { key: string; label: string; count: string; people: Person[] };
type Copy = { all: string; summary: string; careers: { href: string; label: string } };

const COLS = 12;
// the run of a stroke as a share of its box: the box is the visible width w plus the run,
// the run is the height (1.25 w) times the slope of the symbol
const CUT = ((1.25 * 0.5862) / (1 + 1.25 * 0.5862)) * 100;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const roleOf = (p: Person) => (p.unit ? `${p.role} · ${p.unit}` : p.role);

/**
 * The people who work in the group, all of them at once. On wide screens every person is a
 * stroke of the symbol, cut at its slope, and the strokes tile into one large stroke: the group
 * is the mark. Portraits in navy duotone; pointing at one brings it into colour and names it in
 * the corner the slope leaves free; choosing a team lights its people and dims the rest. The
 * slots left after the last person are outline strokes, the places still to fill, next to the
 * link to the open positions. Under the wall, the names as credits, team by team: the readable
 * list (the wall repeats it for the eye). On phones each team is a row of portraits to swipe.
 */
export function TeamWall({ teams, copy }: { teams: Team[]; copy: Copy }) {
  const people = teams.flatMap((t, ti) => t.people.map((p) => ({ ...p, team: ti })));
  const slots = Math.ceil((people.length + 1) / COLS) * COLS;
  const rows = slots / COLS;
  const [team, setTeam] = useState<number | null>(null);
  const [person, setPerson] = useState<number | null>(null);
  const [seen, setSeen] = useState(false);
  const wall = useRef<HTMLDivElement>(null);

  // the strokes come in once, in a diagonal wave, when the wall reaches the screen
  useEffect(() => {
    const el = wall.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shown = person !== null ? people[person] : null;

  return (
    <div className="vp-team" style={{ "--cols": COLS, "--rows": rows } as CSSProperties}>
      <div className="vp-team__stage">
        {/* wide screens: choose a team */}
        <div className="vp-team__filters" role="group" aria-label={copy.summary}>
          {[null, ...teams.map((_, i) => i)].map((i) => (
            <button
              key={i ?? "all"}
              type="button"
              className="vp-team__filter t-small"
              aria-pressed={team === i}
              onClick={() => setTeam(i)}
              onPointerEnter={() => setTeam(i)}
            >
              {i === null ? copy.all : teams[i].label}
              <span className="t-label t-num"> {i === null ? people.length : teams[i].people.length}</span>
            </button>
          ))}
        </div>

        {/* the wall: a visual echo of the credits below */}
        <div ref={wall} className="vp-wall" data-seen={seen ? "" : undefined} data-team={team ?? undefined} aria-hidden="true" onPointerLeave={() => setPerson(null)}>
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="vp-wall__row" style={{ "--r": r } as CSSProperties}>
              {Array.from({ length: COLS }, (_, c) => {
                const i = r * COLS + c;
                const p = people[i];
                const style = { "--c": c, "--r": r } as CSSProperties;
                if (!p)
                  return (
                    <span key={c} className="vp-wall__tile vp-wall__tile--open" style={style}>
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
                        <polygon points={`0,0 ${100 - CUT},0 100,100 ${CUT},100`} />
                      </svg>
                    </span>
                  );
                return (
                  <span
                    key={c}
                    className="vp-wall__tile"
                    style={style}
                    data-on={person === i ? "" : undefined}
                    data-lit={team === null || team === p.team ? "" : undefined}
                    onPointerEnter={() => setPerson(i)}
                  >
                    <span className="vp-wall__cut">
                      <span className="vp-wall__img">
                        <span className="vp-wall__initials">{initials(p.name)}</span>
                        {p.photo ? <Image src={p.photo} alt="" fill sizes="(min-width: 1024px) 12vw, 1px" className="object-cover object-[50%_20%]" /> : null}
                      </span>
                    </span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        {/* the corner the slope leaves free: who this is, or how many we are */}
        <div className="vp-team__caption">
          <div className="vp-team__who" data-on={shown ? "" : undefined} aria-hidden="true">
            {shown ? (
              <>
                <p className="t-label">{teams[shown.team].label}</p>
                <p className="vp-team__name mt-2">{shown.name}</p>
                <p className="t-small mt-1">{roleOf(shown)}</p>
              </>
            ) : null}
          </div>
          <div className="vp-team__summary" data-off={shown ? "" : undefined}>
            <p className="vp-team__name">{copy.summary}</p>
            <TLink href={copy.careers.href} className="vp-ulink t-small mt-3 inline-block">
              {copy.careers.label} →
            </TLink>
          </div>
        </div>

      </div>

      {/* the credits, team by team */}
      <div className="vp-team__credits">
        {teams.map((t, ti) => (
          <section key={t.key} id={t.key} className="vp-team__team" aria-labelledby={`team-${t.key}`} data-dim={team !== null && team !== ti ? "" : undefined}>
            <h3 id={`team-${t.key}`} className="t-label vp-team__teamname">
              {t.label} <span className="t-num">· {t.count}</span>
            </h3>
            <ul className="vp-team__list mt-4">
              {t.people.map((p) => {
                const i = people.findIndex((x) => x.name === p.name);
                return (
                  <li key={p.name} className="vp-team__credit" onPointerEnter={() => setPerson(i)} onPointerLeave={() => setPerson(null)}>
                    <span className="t-small">{p.name}</span>
                    <span className="t-label"> {roleOf(p)}</span>
                  </li>
                );
              })}
            </ul>
            {/* phones and tablets: the team's portraits to swipe */}
            <ul className="vp-team__row" aria-hidden="true">
              {t.people.map((p) => (
                <li key={p.name} className="vp-team__card">
                  <span className="vp-team__photo">
                    <span className="vp-wall__initials">{initials(p.name)}</span>
                    {p.photo ? <Image src={p.photo} alt="" fill sizes="(min-width: 1024px) 1px, 40vw" className="object-cover object-[50%_20%]" /> : null}
                  </span>
                  <span className="t-small mt-3 block leading-tight">{p.name}</span>
                  <span className="t-label mt-1 block">{roleOf(p)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
