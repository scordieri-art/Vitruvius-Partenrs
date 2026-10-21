"use client";

import { useState, type ReactNode } from "react";

/** Team groups as tabs: one group visible at a time instead of a page of sixty portraits. */
export function TeamTabs({ tabs, label }: { tabs: { key: string; label: string; count: number; panel: ReactNode }[]; label: string }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div role="tablist" aria-label={label} className="vp-tabs" data-hscroll="">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={active === i}
            aria-controls={`panel-${t.key}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              const n = (active + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
              setActive(n);
              document.getElementById(`tab-${tabs[n].key}`)?.focus();
            }}
            className="vp-tab"
          >
            {t.label} <span className="t-label t-num">{t.count}</span>
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.key} role="tabpanel" id={`panel-${t.key}`} aria-labelledby={`tab-${t.key}`} hidden={active !== i} className="mt-12">
          {t.panel}
        </div>
      ))}
    </div>
  );
}
