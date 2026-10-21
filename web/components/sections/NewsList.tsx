"use client";

import { useState } from "react";
import { TLink } from "@/components/layout/PageTransition";

export type NewsRow = { href: string; title: string; outlet: string | null; date: string; dateIso: string };

type Labels = { label: string; all: string; group: string; press: string; search: string; searchHint: string; noResults: string };

/** lower case, no accents: "Perché" finds "perche" and the other way round */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * The archive: one filter (all, the group's news, the press review) and a search on
 * title and outlet, then the articles by year as text rows. The whole row is the link;
 * nothing follows the cursor. The server renders every row; filtering only hides rows,
 * so nothing shifts on hydration.
 */
export function NewsList({ rows, labels, countLabel }: { rows: NewsRow[]; labels: Labels; countLabel: string }) {
  const [filter, setFilter] = useState<"all" | "group" | "press">("all");
  const [query, setQuery] = useState("");
  const words = fold(query).split(/\s+/).filter(Boolean);
  const counts = { all: rows.length, group: rows.filter((r) => !r.outlet).length, press: rows.filter((r) => r.outlet).length };
  const visible = rows.filter((r) => {
    if (filter !== "all" && (filter === "press" ? !r.outlet : !!r.outlet)) return false;
    const text = fold(`${r.title} ${r.outlet ?? ""}`);
    return words.every((w) => text.includes(w));
  });
  const years = [...new Set(visible.map((r) => r.dateIso.slice(0, 4)))];

  return (
    <div>
      <div className="mb-[clamp(2.5rem,5vw,4rem)] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div role="group" aria-label={labels.label} className="vp-tabs" data-hscroll="">
          {(["all", "group", "press"] as const).map((k) => (
            <button key={k} type="button" className="vp-tab" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {labels[k]} <span className="t-label t-num">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="vp-search lg:w-[22rem]">
          <label htmlFor="news-search" className="t-label">
            {labels.search}
          </label>
          <input
            id="news-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchHint}
            autoComplete="off"
            enterKeyHint="search"
            className="vp-search__input t-body"
          />
        </div>
      </div>

      <p role="status" className="sr-only">
        {countLabel.replace("{n}", String(visible.length))}
      </p>
      {visible.length === 0 ? <p className="t-body-l max-w-[40ch] text-[var(--fg-2)]">{labels.noResults}</p> : null}
      <div className="grid gap-[clamp(3rem,6vw,5rem)]">
        {years.map((y) => (
          <section key={y} aria-labelledby={`y${y}`} className="grid-12 gap-y-4">
            <h2 id={`y${y}`} className="t-m t-num col-span-4 lg:col-span-2 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
              {y}
            </h2>
            <ul className="col-span-4 border-t border-[var(--line)] lg:col-span-10">
              {visible
                .filter((r) => r.dateIso.startsWith(y))
                .map((r) => (
                  <li key={r.href} className="border-b border-[var(--line)]">
                    <TLink href={r.href} className="group grid-12 items-baseline gap-y-2 py-6 lg:py-8" transitionLabel={r.title}>
                      <span className="t-label col-span-4 lg:col-span-3">
                        <time dateTime={r.dateIso}>{r.date}</time>
                        {r.outlet ? <span className="block text-[var(--fg)]">{r.outlet}</span> : null}
                      </span>
                      <span className="vp-newsrow__title col-span-4 flex items-start justify-between gap-6 lg:col-span-9">
                        <span className="min-w-0 [text-wrap:pretty]">
                          <span className="vp-rowtitle">{r.title}</span>
                        </span>
                        <span aria-hidden="true" className="vp-go hidden lg:inline-block">
                          →
                        </span>
                      </span>
                    </TLink>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
