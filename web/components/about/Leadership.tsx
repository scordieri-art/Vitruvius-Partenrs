"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type Person = { name: string; role: string; photo?: string | null };
type Group = { key: string; name: string; kind: string; href?: string; linkLabel?: string; people: Person[] };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
const two = (n: number) => String(n).padStart(2, "0");

/**
 * Who leads the group: each leader is a stroke of the symbol. On wide screens five bands cut at
 * the slope of the brand stroke stand side by side across the page, the portraits in navy
 * duotone; pointing at a band or at a name in the legend below it (or reaching the name with the
 * keyboard) widens that band and brings the person into colour, with name, role and company.
 * Left alone in view, the bands take turns slowly; the first gesture stops that for good.
 * The legend is the readable list; the bands repeat it for the eye. On phones the portraits
 * form a row to swipe. Reduced motion: no turns, no easing.
 */
export function Leadership({ groups, externalNote }: { groups: Group[]; externalNote: string }) {
  const people = groups.flatMap((g) => g.people.map((p) => ({ ...p, group: g })));
  const [active, setActive] = useState(0);
  const touched = useRef(false);
  const stage = useRef<HTMLDivElement>(null);

  const pick = (i: number) => {
    touched.current = true;
    setActive(i);
  };

  // left alone and in view, the bands take turns
  useEffect(() => {
    const el = stage.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const stop = () => window.clearInterval(timer);
    const io = new IntersectionObserver(
      ([e]) => {
        stop();
        if (e.isIntersecting && !touched.current)
          timer = window.setInterval(() => {
            if (touched.current) return stop();
            if (!document.hidden) setActive((a) => (a + 1) % people.length);
          }, 4200);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      stop();
      io.disconnect();
    };
  }, [people.length]);

  return (
    <div ref={stage} className="vp-lead" style={{ "--n": people.length } as CSSProperties}>
      {/* wide screens: the bands, a visual echo of the legend below */}
      <div className="vp-bands" aria-hidden="true">
        {people.map((p, i) => (
          <div key={p.name} className="vp-band" data-on={i === active ? "" : undefined} onPointerEnter={() => pick(i)} onClick={() => pick(i)}>
            <div className="vp-band__cut">
              <span className="vp-band__img">
                <span className="vp-band__initials">{initials(p.name)}</span>
                {p.photo ? <Image src={p.photo} alt="" fill sizes="(min-width: 1024px) 45vw, 1px" className="object-cover object-[50%_22%]" /> : null}
              </span>
              <span className="vp-band__tint" />
              <span className="vp-band__index t-label t-num">{two(i + 1)}</span>
              <span className="vp-band__caption">
                <span className="t-label vp-band__company">{p.group.name}</span>
                <span className="vp-band__name">{p.name}</span>
                <span className="t-small vp-band__role">{p.role}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* the legend: who is who, and the way in for the keyboard */}
      <ol className="vp-lead__legend">
        {people.map((p, i) => (
          <li key={p.name}>
            <button type="button" className="vp-lead__who" aria-pressed={i === active} onPointerEnter={() => pick(i)} onFocus={() => pick(i)} onClick={() => pick(i)}>
              <span className="t-label t-num">{two(i + 1)}</span>
              <span className="vp-lead__whoname">{p.name}</span>
              <span className="t-label">
                {p.role} · {p.group.name}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {/* phones and tablets: a row of portraits to swipe */}
      <ul className="vp-lead__row">
        {people.map((p) => (
          <li key={p.name} className="vp-lead__card">
            <span className="vp-lead__photo" aria-hidden="true">
              <span className="vp-band__initials">{initials(p.name)}</span>
              {p.photo ? <Image src={p.photo} alt="" fill sizes="(min-width: 1024px) 1px, 75vw" className="object-cover object-[50%_22%]" /> : null}
            </span>
            <span className="t-label mt-4 block">{p.group.name}</span>
            <span className="t-m mt-1 block">{p.name}</span>
            <span className="t-small mt-1 block text-[var(--fg-2)]">{p.role}</span>
          </li>
        ))}
      </ul>

      {/* the two divisions' own sites */}
      <p className="vp-lead__links t-small">
        {groups
          .filter((g) => g.href)
          .map((g) => (
            <a key={g.key} href={g.href} target="_blank" rel="noopener noreferrer" className="vp-ulink">
              {g.linkLabel} <span aria-hidden="true">↗</span>
              <span className="sr-only"> ({externalNote})</span>
            </a>
          ))}
      </p>
    </div>
  );
}
