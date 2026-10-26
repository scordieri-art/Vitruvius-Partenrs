"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { TLink } from "@/components/layout/PageTransition";
import { SafeImage } from "@/components/ui/SafeImage";

export type NewsCard = { href: string; title: string; outlet: string | null; date: string; dateIso: string; image: string | null };

type Labels = {
  label: string;
  all: string;
  group: string;
  press: string;
  search: string;
  searchHint: string;
  noResults: string;
  drawer: string;
  open: string;
  close: string;
  random: string;
};

/** lower case, no accents: "Perché" finds "perche" and the other way round */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const two = (n: number) => String(n).padStart(2, "0");
/** a card at random, for «Pick one» (called from the click, never while rendering) */
const anyOf = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/**
 * The archive as a cabinet: one drawer a year, the newest on top. Each drawer front carries its
 * year in a label holder and the brand stroke as its pull. Pointing at a closed drawer lifts
 * the tabs of its index cards out of it, one tab per article, so the front shows how full it
 * is. Opening it slides the drawer out and the cards rise one after another into a ruled grid:
 * picture, where it was published, title, date; the first card of a drawer widens as much as it
 * takes for the rows to come out full. The newest drawers are open on arrival. The
 * filter and the search narrow every drawer at once: drawers with something to show open,
 * empty ones close and grey out. «Pick one» opens a drawer at random and points at one card.
 * Every drawer is a disclosure button; the server renders every card.
 */
export function NewsCabinet({ cards, labels, countLabel, countOne }: { cards: NewsCard[]; labels: Labels; countLabel: string; countOne: string }) {
  const count = (n: number) => (n === 1 ? countOne : countLabel).replace("{n}", String(n));
  const [filter, setFilter] = useState<"all" | "group" | "press">("all");
  const [query, setQuery] = useState("");
  const years = [...new Set(cards.map((c) => c.dateIso.slice(0, 4)))];
  // on arrival the newest drawers stand open, as many as it takes to show three articles
  const [open, setOpen] = useState<Set<string>>(() => {
    const s = new Set<string>();
    let shown = 0;
    for (const y of years) {
      if (shown >= 3) break;
      s.add(y);
      shown += cards.filter((c) => c.dateIso.startsWith(y)).length;
    }
    return s;
  });
  // while narrowing, the drawers the visitor closed among those with results
  const [shut, setShut] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const words = fold(query).split(/\s+/).filter(Boolean);
  const counts = { all: cards.length, group: cards.filter((c) => !c.outlet).length, press: cards.filter((c) => c.outlet).length };
  const visible = cards.filter((c) => {
    if (filter !== "all" && (filter === "press" ? !c.outlet : !!c.outlet)) return false;
    const text = fold(`${c.title} ${c.outlet ?? ""}`);
    return words.every((w) => text.includes(w));
  });
  const narrowed = filter !== "all" || words.length > 0;
  const inYear = (y: string) => visible.filter((c) => c.dateIso.startsWith(y));
  // narrowing opens every drawer with something to show; otherwise the visitor's choice
  const isOpen = (y: string) => (narrowed ? inYear(y).length > 0 && !shut.has(y) : open.has(y));

  const toggle = (y: string) => {
    const flip = (s: Set<string>) => {
      const next = new Set(s);
      if (next.has(y)) next.delete(y);
      else next.add(y);
      return next;
    };
    if (narrowed) return setShut(flip);
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(y)) next.delete(y);
      else next.add(y);
      return next;
    });
  };

  const pick = () => {
    if (!visible.length) return;
    const c = anyOf(visible);
    const y = c.dateIso.slice(0, 4);
    if (narrowed)
      setShut((s) => {
        const next = new Set(s);
        next.delete(y);
        return next;
      });
    else setOpen((s) => new Set(s).add(y));
    setPicked(c.href);
  };

  // the picked card: once its drawer has opened, bring it into view and mark it for a moment
  useEffect(() => {
    if (!picked) return;
    const t1 = window.setTimeout(() => {
      const el = root.current?.querySelector<HTMLElement>(`[data-card="${CSS.escape(picked)}"]`);
      if (!el) return;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lenis = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement, o?: { offset?: number; immediate?: boolean }) => void } }).__lenis;
      if (lenis) lenis.scrollTo(el, { offset: -window.innerHeight / 3, immediate: reduce });
      else el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      el.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    }, 450);
    const t2 = window.setTimeout(() => setPicked(null), 3200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [picked]);

  return (
    <div ref={root} className="vp-cab">
      <div className="vp-cab__tools">
        <div role="group" aria-label={labels.label} className="vp-tabs" data-hscroll="">
          {(["all", "group", "press"] as const).map((k) => (
            <button key={k} type="button" className="vp-tab" aria-pressed={filter === k} onClick={() => {
                setFilter(k);
                setShut(new Set());
              }}>
              {labels[k]} <span className="t-label t-num">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="vp-cab__right">
          <div className="vp-search lg:w-[20rem]">
            <label htmlFor="news-search" className="t-label">
              {labels.search}
            </label>
            <input
              id="news-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShut(new Set());
              }}
              placeholder={labels.searchHint}
              autoComplete="off"
              enterKeyHint="search"
              className="vp-search__input t-body"
            />
          </div>
          <button type="button" className="vp-cab__random t-small" onClick={pick} disabled={!visible.length}>
            <span aria-hidden="true" className="vp-cab__dice">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3" />
              </svg>
            </span>
            {labels.random}
          </button>
        </div>
      </div>

      <p role="status" className="sr-only">
        {count(visible.length)}
      </p>
      {visible.length === 0 ? <p className="t-body-l mb-10 max-w-[40ch] text-[var(--fg-2)]">{labels.noResults}</p> : null}

      <div className="vp-cab__drawers">
        {years.map((y, yi) => {
          const all = cards.filter((c) => c.dateIso.startsWith(y));
          const shown = inYear(y);
          const on = isOpen(y);
          const empty = shown.length === 0;
          return (
            <section key={y} className="vp-drawer" aria-labelledby={`drawer-${y}`} data-open={on ? "" : undefined} data-empty={empty ? "" : undefined}>
              {/* the tabs of the cards inside, one per article, lifting out when the drawer is pointed at */}
              <span className="vp-drawer__tabs" aria-hidden="true">
                {all.map((c, i) => (
                  <span
                    key={c.href}
                    className="vp-drawer__tab"
                    data-in={shown.includes(c) ? "" : undefined}
                    style={{ "--i": i, "--x": `${(i / Math.max(all.length, 1)) * 86}%` } as CSSProperties}
                  />
                ))}
              </span>
              <h3 id={`drawer-${y}`} className="vp-drawer__head">
                <button type="button" className="vp-drawer__front" aria-expanded={on} aria-controls={`drawer-body-${y}`} onClick={() => toggle(y)} disabled={empty}>
                  <span className="vp-drawer__holder">
                    <span className="t-label">
                      {labels.drawer} {two(yi + 1)}
                    </span>
                    <span className="vp-drawer__year t-num">{y}</span>
                  </span>
                  <span className="vp-drawer__pull" aria-hidden="true" />
                  <span className="vp-drawer__meta">
                    <span className="t-label t-num">{count(shown.length)}</span>
                    <span className="vp-drawer__state t-small" aria-hidden="true">
                      {on ? `${labels.close} −` : `${labels.open} +`}
                    </span>
                  </span>
                </button>
              </h3>
              <div className="vp-drawer__body" id={`drawer-body-${y}`}>
                {/* the first card widens so the rows come out full: on three columns and on two */}
                <ul className="vp-drawer__cards" data-lead3={[1, 3, 2][shown.length % 3]} data-lead2={shown.length % 2 ? 2 : 1}>
                  {shown.map((c, i) => (
                    <li key={c.href} className="vp-card" data-card={c.href} data-picked={picked === c.href ? "" : undefined} style={{ "--i": i } as CSSProperties}>
                      <TLink href={c.href} transitionLabel={c.title} className="vp-card__link group">
                        <span className="vp-card__pic">
                          <span className="vp-plate" aria-hidden="true">
                            <span className="t-label">{c.outlet ?? labels.group}</span>
                            <span className="t-label t-num">{y}</span>
                          </span>
                          {c.image ? (
                            <SafeImage
                              src={c.image}
                              alt=""
                              fill
                              // the first covers of the drawer open on arrival are in view at once: no lazy wait
                              loading={yi === 0 && i < 2 ? "eager" : undefined}
                              fetchPriority={yi === 0 && i === 0 ? "high" : undefined}
                              sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 90vw"
                              className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-enter)] group-hover:scale-[1.04]"
                            />
                          ) : null}
                        </span>
                        <span className="vp-card__tag t-label">{c.outlet ?? labels.group}</span>
                        <span className="vp-card__title">
                          <span className="vp-rowtitle">{c.title}</span>
                        </span>
                        <span className="vp-card__foot t-label">
                          <time dateTime={c.dateIso}>{c.date}</time>
                          <span aria-hidden="true" className="vp-go">
                            →
                          </span>
                        </span>
                      </TLink>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
