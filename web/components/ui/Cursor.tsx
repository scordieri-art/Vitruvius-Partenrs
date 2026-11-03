"use client";

import { useEffect, useRef } from "react";
import { SYMBOL_POLYGONS, SYMBOL_VIEWBOX } from "@/components/brand/logo-paths";

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(" ");
const PRIMARY = pts(SYMBOL_POLYGONS.primary);
const SECONDARY = pts(SYMBOL_POLYGONS.secondary);

/** where the system's own cursor (the text caret) comes back */
const TYPING =
  'input:not([type="checkbox"],[type="radio"],[type="range"],[type="button"],[type="submit"],[type="reset"],[type="file"],[type="color"],[type="image"]),textarea,[contenteditable]:not([contenteditable="false"]),iframe';
const ACTION =
  'a[href],button,label,summary,select,input,[role="button"],[role="link"],[role="tab"],[role="radio"],[role="checkbox"],[role="switch"],[role="option"],[role="menuitem"]';
const CHOSEN =
  '[aria-current]:not([aria-current="false"]),[aria-pressed="true"],[aria-selected="true"],[aria-checked="true"],[aria-expanded="true"],:checked';

type Kind = "off" | "rest" | "act" | "on" | "tag";
type Look = "ball" | "logo";

/** the two looks under review: ?cursore=pallina (the default) or ?cursore=logo, kept for the visit */
function chosenLook(): Look {
  try {
    const q = new URLSearchParams(location.search).get("cursore");
    if (q === "logo" || q === "pallina") sessionStorage.setItem("vp-cursore", q);
    return (q ?? sessionStorage.getItem("vp-cursore")) === "logo" ? "logo" : "ball";
  } catch {
    return "ball";
  }
}

/** a click's negative lasts at least this long, so a quick click shows it too */
const NEGATIVE_MIN = 420;

/** a computed colour's luminance (0–1) and alpha: rgb(), rgba() or color(srgb …) */
function tone(c: string): [number, number] | null {
  const n = c
    .replace(/^color\(\s*[\w-]+/, "")
    .match(/[\d.]+/g)
    ?.map(Number);
  if (!n || n.length < 3) return null;
  const k = c.startsWith("color(") ? 1 : 255;
  return [(0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]) / k, n.length > 3 ? n[3] : 1];
}

/**
 * The pointer. With a mouse the system's cursor is hidden and this takes its place, exactly where
 * the mouse is, in one of two looks under review:
 * - the ball (data-v="ball"): a navy dot whose centre is the pointer; over something that can be
 *   done a ring around a point; over a project's picture a disc with the word of its data-cursor
 *   («Apri»);
 * - the symbol (data-v="logo"): the V, the tip of its first stroke the pointer's tip; over an action
 *   larger and in outline (as a planned phase), solid over what is chosen or current; over a
 *   picture the second mass gives way to the word, on a tag cut on the slope.
 * Pressing turns either into a negative of what is beneath (white, mix-blend-mode: difference),
 * larger, for at least NEGATIVE_MIN even on a quick click. Over navy it is paper; a hairline rim
 * keeps it visible on photos.
 *
 * The system's cursor stays over text fields (its caret), on touch screens and in forced colours,
 * and until the mouse first moves (if scripts fail, nothing is hidden). For the eye only: links and
 * buttons keep their names. Components that choose on a pointer's rest (FiguresLive, PressLive)
 * say so with a "vp-pick" event, so the state follows the choice.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const tag = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const inBall = word.current;
    const onTag = tag.current;
    if (!el || !inBall || !onTag) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(forced-colors: active)").matches) return;
    const look = chosenLook();
    el.dataset.v = look;
    const html = document.documentElement;

    let px = 0, py = 0, raf = 0, probe = false, shown = false;
    let kind: Kind = "off", text = "", wide = 0;
    let target: Element | null = null;
    let seen: Element | null | undefined;
    let pressedAt = 0, lift = 0;
    let later: number[] = [];

    // dark beneath (a navy section, a navy button): the pointer turns paper, its rim navy
    const dark = (t: Element) => {
      for (let n: Element | null = t; n && n !== html; n = n.parentElement) {
        const c = tone(getComputedStyle(n).backgroundColor);
        if (c && c[1] >= 0.5) return c[0] < 0.4;
      }
      return false;
    };

    const read = (t: Element | null) => {
      let k: Kind = "off", w = "";
      // off the page's content: over a text field, outside the window, on the page's scrollbar
      if (t && t !== html && !t.closest(TYPING) && px < html.clientWidth && py < html.clientHeight) {
        k = "rest";
        const c = t.closest<HTMLElement>("[data-cursor]");
        if (c?.dataset.cursor) {
          k = "tag";
          w = c.dataset.cursor;
        } else {
          const a = t.closest<HTMLElement>(ACTION);
          if (a && !a.matches(':disabled,[aria-disabled="true"]')) {
            const ctl = a instanceof HTMLLabelElement ? a.control : null;
            k = a.matches(CHOSEN) || (ctl instanceof HTMLInputElement && ctl.checked) ? "on" : "act";
          }
        }
      }
      // beside a word it stays navy, as the label it is: beneath is a photo, not its card's colour
      if (t && k !== "off") el.toggleAttribute("data-dark", k !== "tag" && dark(t));
      // the word stays while the tag closes, so it folds away with it
      if (w && w !== text) {
        text = w;
        inBall.textContent = w;
        onTag.textContent = w;
        wide = look === "logo" ? onTag.offsetWidth : 0;
      }
      if (k === kind) return;
      kind = k;
      el.dataset.k = k;
    };

    const frame = () => {
      raf = 0;
      if (probe) {
        probe = false;
        target = document.elementFromPoint(px, py);
      }
      if (target !== seen) {
        seen = target;
        read(target);
      }
      el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      // the symbol's tag, near the right edge, opens on the stroke's other side
      if (look === "logo") el.toggleAttribute("data-flip", kind === "tag" && px + 32 + wide > html.clientWidth - 12);
    };
    // again: what is under the pointer may have changed beneath it (a scroll, a choice, a new page)
    const ask = (again = false) => {
      if (again) {
        probe = true;
        seen = undefined;
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const show = (on: boolean) => {
      if (on === shown) return;
      shown = on;
      html.classList.toggle("vp-cur-on", on);
    };
    const move = (e: PointerEvent) => {
      // a finger or a pen: the system's cursor, if any, and none of this
      if (e.pointerType !== "mouse") {
        show(false);
        target = null;
        seen = undefined;
        ask();
        return;
      }
      px = e.clientX;
      py = e.clientY;
      target = e.target as Element;
      show(true);
      ask();
    };
    const leave = () => {
      target = null;
      seen = undefined;
      ask();
    };
    const scrolled = () => (shown ? ask(true) : undefined);

    // the negative: from the press, for at least NEGATIVE_MIN, then back as the button is released
    const press = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      clearTimeout(lift);
      pressedAt = performance.now();
      el.dataset.neg = "";
    };
    const release = () => {
      if (!el.hasAttribute("data-neg")) return;
      clearTimeout(lift);
      lift = window.setTimeout(() => delete el.dataset.neg, Math.max(0, NEGATIVE_MIN - (performance.now() - pressedAt)));
    };
    // after a click the state may change (pressed, chosen, a new page)
    const clicked = () => {
      later.forEach(clearTimeout);
      later = [40, 500, 1200].map((ms) => window.setTimeout(() => ask(true), ms));
    };
    const picked = () => ask(true);
    const back = () => later.push(window.setTimeout(() => ask(true), 600));

    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerdown", press, { passive: true });
    addEventListener("pointerup", release, { passive: true });
    addEventListener("pointercancel", release, { passive: true });
    addEventListener("blur", release);
    addEventListener("scroll", scrolled, { passive: true });
    addEventListener("popstate", back);
    html.addEventListener("pointerleave", leave);
    document.addEventListener("click", clicked, true);
    document.addEventListener("change", picked, true);
    document.addEventListener("vp-pick", picked, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(lift);
      later.forEach(clearTimeout);
      html.classList.remove("vp-cur-on");
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", press);
      removeEventListener("pointerup", release);
      removeEventListener("pointercancel", release);
      removeEventListener("blur", release);
      removeEventListener("scroll", scrolled);
      removeEventListener("popstate", back);
      html.removeEventListener("pointerleave", leave);
      document.removeEventListener("click", clicked, true);
      document.removeEventListener("change", picked, true);
      document.removeEventListener("vp-pick", picked, true);
    };
  }, []);

  return (
    <div ref={root} className="vp-cur" aria-hidden="true">
      <span className="vp-cur__ball">
        <span ref={word} className="vp-cur__word t-small" />
      </span>
      <svg className="vp-cur__logo" viewBox={SYMBOL_VIEWBOX} focusable="false">
        <polygon className="vp-cur__rim" points={PRIMARY} />
        <polygon className="vp-cur__rim vp-cur__b" points={SECONDARY} />
        <polygon className="vp-cur__a" points={PRIMARY} />
        <polygon className="vp-cur__a vp-cur__b" points={SECONDARY} />
      </svg>
      <span ref={tag} className="vp-cur__tag t-small" />
    </div>
  );
}
