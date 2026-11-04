"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Mark } from "@/components/marks/Mark";

export type Line = { key: string; label: string; value: string; href: string; action: string; num?: boolean };

/**
 * Contact's opening: each direct line a large row (what it is, the address or number set big, what
 * the row does). Passing over a row, or reaching it from the keyboard, fills it with navy from the
 * left along the symbol's slope and its mark fills; the whole row is the link. The email row also
 * copies the address, saying so for a moment (and to screen readers).
 */
export function ContactLines({ lines, copy, copied, copyValue }: { lines: Line[]; copy: string; copied: string; copyValue: string }) {
  const [done, setDone] = useState(false);
  const wait = useRef(0);
  useEffect(() => () => clearTimeout(wait.current), []);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setDone(true);
      clearTimeout(wait.current);
      wait.current = window.setTimeout(() => setDone(false), 2200);
    } catch {
      // no clipboard (an old browser, a denied permission): the row's own link still writes
    }
  };
  return (
    <ul className="vp-lines">
      {lines.map((l, i) => (
        <li key={l.key} className="vp-lines__row" style={{ "--i": i } as CSSProperties}>
          <a href={l.href} className="vp-lines__link">
            <span className="vp-lines__label t-label">
              <Mark kind="outline" className="vp-lines__mark" />
              {l.label}
            </span>
            <span className={`vp-lines__value${l.num ? " t-num" : ""}`}>{l.value}</span>
            <span className="vp-lines__go t-small" aria-hidden="true">
              {l.action} <span className="vp-lines__arrow">→</span>
            </span>
          </a>
          {l.href.startsWith("mailto:") ? (
            <button type="button" className="vp-lines__copy t-small" onClick={onCopy}>
              <span aria-live="polite">{done ? copied : copy}</span>
              <span className="sr-only"> {l.value}</span>
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
