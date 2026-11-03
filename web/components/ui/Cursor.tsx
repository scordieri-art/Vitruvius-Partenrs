"use client";

import { useEffect, useRef } from "react";
import { SYMBOL_POLYGONS, SYMBOL_VIEWBOX } from "@/components/brand/logo-paths";

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(" ");
const PRIMARY = pts(SYMBOL_POLYGONS.primary);
const SECONDARY = pts(SYMBOL_POLYGONS.secondary);

/** where the system's own cursor (the text caret) is the right one */
const TYPING =
  'input:not([type="checkbox"],[type="radio"],[type="range"],[type="button"],[type="submit"],[type="reset"],[type="file"],[type="color"],[type="image"]),textarea,[contenteditable]:not([contenteditable="false"]),iframe';
const ACTION =
  'a[href],button,label,summary,select,input,[role="button"],[role="link"],[role="tab"],[role="radio"],[role="checkbox"],[role="switch"],[role="option"],[role="menuitem"]';
const CHOSEN =
  '[aria-current]:not([aria-current="false"]),[aria-pressed="true"],[aria-selected="true"],[aria-checked="true"],[aria-expanded="true"],:checked';

type Kind = "off" | "act" | "on" | "tag";
/** the stroke is 22 px tall beside an action, 34 px (the tag's height) beside a word */
const SCALE: Record<Kind, number> = { off: 1, act: 1, on: 1, tag: 34 / 22 };
/** from the pointer's tip to the stroke's, across and down */
const GAP = 18;
/** the brand's two curves (globals.css): entrances, movements */
const ENTER = "cubic-bezier(0.22, 1, 0.36, 1)";
const MOVE = "cubic-bezier(0.65, 0, 0.35, 1)";

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
 * Beside the pointer, the symbol's primary stroke, speaking the marks' language: over something
 * that can be done (a link, a button, a choice) it appears in outline; over what is chosen or
 * current, and while the button is held, solid. On a click the symbol's second mass joins it: for
 * a moment the V is complete, and larger, then it lets go. Over a project's picture the stroke grows to a tag
 * cut on the slope, with the word of the element's data-cursor («Apri»), where the second mass
 * would be. It eases after the pointer; with reduced motion it sits with it and the V is left out.
 *
 * The system's pointer stays as it is (this only accompanies it), only with a mouse, never over a
 * text field, nor in forced colours. For the eye only: links and buttons keep their own names.
 * Components that choose on a pointer's rest (FiguresLive, PressLive) say so with a "vp-pick"
 * event, so the stroke fills as the choice is made.
 */
export function Cursor() {
  const mark = useRef<HTMLDivElement>(null);
  const arm = useRef<SVGSVGElement>(null);
  const word = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = mark.current;
    const st = arm.current;
    const tg = word.current;
    const tri = st?.querySelector("polygon");
    const stroke = el?.querySelector<SVGSVGElement>(".vp-cur__mark");
    if (!el || !st || !tg || !tri || !stroke) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(forced-colors: active)").matches) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;

    let px = 0, py = 0; // the pointer
    let x = 0, y = 0; // the stroke, easing after it
    let raf = 0, done = 0, held = -1e3, probe = false;
    let kind: Kind = "off", text = "", wide = 0;
    let target: Element | null = null;
    let seen: Element | null | undefined;
    let later: number[] = [];

    // dark beneath (a navy section, a navy button): the stroke turns paper, its rim navy
    const dark = (t: Element) => {
      for (let n: Element | null = t; n && n !== root; n = n.parentElement) {
        const c = tone(getComputedStyle(n).backgroundColor);
        if (c && c[1] >= 0.5) return c[0] < 0.4;
      }
      return false;
    };

    const read = (t: Element | null) => {
      let k: Kind = "off", w = "";
      if (t && !t.closest(TYPING)) {
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
      // beside a word the stroke and its tag are navy, as the label they are: under a picture what
      // is beneath is the photo, not the colour of the card that holds it
      if (t && k !== "off") el.toggleAttribute("data-dark", k !== "tag" && dark(t));
      // the word stays while the tag closes, so it folds away with it
      if (w && w !== text) {
        text = w;
        tg.textContent = w;
        wide = tg.offsetWidth;
      }
      if (k === kind) return;
      // appearing: from the pointer, not from where it was last seen
      if (kind === "off") {
        x = px + GAP;
        y = py + GAP;
      }
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
      const tx = px + GAP, ty = py + GAP;
      if (still.matches || kind === "off") {
        x = tx;
        y = ty;
      } else {
        x += (tx - x) * 0.24;
        y += (ty - y) * 0.24;
      }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.toggleAttribute("data-flip", kind === "tag" && x + 32 + wide > root.clientWidth - 12);
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(frame);
    };
    // again: what is under the pointer may have changed beneath it (a scroll, a choice, a new page)
    const ask = (again = false) => {
      if (again) {
        probe = true;
        seen = undefined;
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        target = null;
        seen = undefined;
        ask();
        return;
      }
      px = e.clientX;
      py = e.clientY;
      target = e.target as Element;
      ask();
    };
    const leave = () => {
      target = null;
      seen = undefined;
      ask();
    };
    const scrolled = () => kind !== "off" || target ? ask(true) : undefined;
    const press = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button === 0) el.dataset.press = "";
    };
    const release = () => {
      delete el.dataset.press;
    };

    // the V, complete for a moment: the stroke grows as the second mass slides in along its own
    // edge, the two hold, then the mass lets go and the stroke returns to its size. The stroke and
    // the mass (fixed where the click was) share one timeline, so they stay one symbol
    const sign = () => {
      const s = SCALE[kind], big = s * 1.7;
      const at = (k: number) => `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${k})`;
      st.toggleAttribute("data-dark", el.hasAttribute("data-dark"));
      el.dataset.done = "";
      clearTimeout(done);
      done = window.setTimeout(() => delete el.dataset.done, 760);
      const time = { duration: 900 };
      stroke.animate([{ scale: `${s}`, easing: ENTER }, { scale: `${big}`, offset: 0.26 }, { scale: `${big}`, offset: 0.62, easing: MOVE }, { scale: `${s}` }], time);
      st.animate([{ transform: at(s), easing: ENTER }, { transform: at(big), offset: 0.26 }, { transform: at(big), offset: 0.62, easing: MOVE }, { transform: at(s) }], time);
      tri.animate(
        [
          { transform: "translate(48px, -72px)", opacity: 0, easing: ENTER },
          { transform: "translate(0, 0)", opacity: 1, offset: 0.26 },
          { transform: "translate(0, 0)", opacity: 1, offset: 0.62, easing: MOVE },
          { transform: "translate(16px, -24px)", opacity: 0 },
        ],
        time,
      );
    };
    const click = (e: MouseEvent) => {
      // a key's click (detail 0) has no pointer to sign beside
      if (e.detail === 0 || !(e.target instanceof Element) || !e.target.closest(ACTION)) return;
      later.forEach(clearTimeout);
      later = [40, 500, 1200].map((ms) => window.setTimeout(() => ask(true), ms));
      // one sign per click (a label's click reaches its input too); none on a picture's tag
      if (still.matches || (kind !== "act" && kind !== "on") || e.timeStamp - held < 120) return;
      held = e.timeStamp;
      sign();
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
    root.addEventListener("pointerleave", leave);
    document.addEventListener("click", click, true);
    document.addEventListener("change", picked, true);
    document.addEventListener("vp-pick", picked, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
      later.forEach(clearTimeout);
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", press);
      removeEventListener("pointerup", release);
      removeEventListener("pointercancel", release);
      removeEventListener("blur", release);
      removeEventListener("scroll", scrolled);
      removeEventListener("popstate", back);
      root.removeEventListener("pointerleave", leave);
      document.removeEventListener("click", click, true);
      document.removeEventListener("change", picked, true);
      document.removeEventListener("vp-pick", picked, true);
    };
  }, []);

  return (
    <>
      <svg ref={arm} className="vp-cur__arm" viewBox={SYMBOL_VIEWBOX} aria-hidden="true" focusable="false">
        <polygon points={SECONDARY} />
      </svg>
      <div ref={mark} className="vp-cur" aria-hidden="true">
        <svg className="vp-cur__mark" viewBox={SYMBOL_VIEWBOX} focusable="false">
          <polygon className="vp-cur__rim" points={PRIMARY} />
          <polygon className="vp-cur__a" points={PRIMARY} />
        </svg>
        <span ref={word} className="vp-cur__tag t-small" />
      </div>
    </>
  );
}
