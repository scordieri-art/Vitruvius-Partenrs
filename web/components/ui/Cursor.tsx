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
const CHOSEN = '[aria-current]:not([aria-current="false"]),[aria-pressed="true"],[aria-selected="true"],[aria-checked="true"],[aria-expanded="true"],:checked';

type Kind = "off" | "rest" | "act" | "on" | "tag";

/** the pencil line: how long a point of it lasts (ms), its width and darkness when fresh */
const LINE_LIFE = 650;
const LINE_WIDTH = 1.7;
const LINE_ALPHA = 0.85;

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
 * The pointer. With a mouse the system's cursor is hidden and the symbol takes its place, exactly
 * where the mouse is: the V, the tip of its first stroke the pointer's tip; over an action larger
 * and in outline (as a planned phase), solid over what is chosen or current; over a project's
 * picture the second mass gives way to the word of its data-cursor («Apri»), on a tag cut on the
 * slope. As it moves it draws behind its tip a line, as a pencil would: thin, darker where it is
 * fresh and thinner where the hand went fast, fading from its tail in LINE_LIFE, so a still pointer
 * has none (no line with reduced motion). Pressing turns it into a
 * negative of what is beneath (white, mix-blend-mode: difference), larger, for at least
 * NEGATIVE_MIN even on a quick click. Over navy it is paper; a hairline rim keeps it visible on
 * photos.
 *
 * The system's cursor stays over text fields (its caret), on touch screens and in forced colours,
 * and until the mouse first moves (if scripts fail, nothing is hidden). For the eye only: links and
 * buttons keep their names. Components that choose on a pointer's rest (FiguresLive, PressLive)
 * say so with a "vp-pick" event, so the state follows the choice.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const trail = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = root.current;
    const onTag = tag.current;
    const tr = trail.current;
    if (!el || !onTag || !tr) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(forced-colors: active)").matches) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const html = document.documentElement;
    const pen = tr.getContext("2d");
    if (!pen) return;
    // where the pointer has been, oldest first, with when and how fast
    const line: { x: number; y: number; t: number; v: number }[] = [];
    let ink = "10, 35, 66";
    let lineRaf = 0;
    const fit = () => {
      const r = devicePixelRatio || 1;
      tr.width = Math.round(innerWidth * r);
      tr.height = Math.round(innerHeight * r);
      pen.setTransform(r, 0, 0, r, 0, 0);
    };
    fit();

    let px = 0,
      py = 0,
      raf = 0,
      probe = false,
      shown = false;
    let kind: Kind = "off",
      text = "",
      wide = 0;
    let target: Element | null = null;
    let seen: Element | null | undefined;
    let pressedAt = 0,
      lift = 0;
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
      let k: Kind = "off",
        w = "";
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
      if (t && k !== "off") {
        const d = k !== "tag" && dark(t);
        el.toggleAttribute("data-dark", d);
        ink = d ? "250, 250, 249" : "10, 35, 66";
      }
      // the word stays while the tag closes, so it folds away with it
      if (w && w !== text) {
        text = w;
        onTag.textContent = w;
        wide = onTag.offsetWidth;
      }
      if (k === kind) return;
      kind = k;
      el.dataset.k = k;
      // the line only behind the bare symbol: not beside the word, not off the page
      if (k === "off" || k === "tag") line.length = 0;
    };

    // the pencil: each stretch of the path drawn by its age (fainter, thinner) and by the hand's
    // speed (a fast stroke is lighter); it redraws until the last point has faded
    const draw = () => {
      lineRaf = 0;
      const now = performance.now();
      while (line.length && now - line[0].t > LINE_LIFE) line.shift();
      pen.clearRect(0, 0, innerWidth, innerHeight);
      if (line.length < 2) {
        line.length = Math.min(line.length, 1);
        return;
      }
      pen.lineCap = "round";
      pen.lineJoin = "round";
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1],
          b = line[i];
        const life = 1 - (now - b.t) / LINE_LIFE;
        const press = 1 / (1 + b.v * 0.25);
        pen.strokeStyle = `rgba(${ink}, ${(LINE_ALPHA * life * (0.55 + 0.45 * press)).toFixed(3)})`;
        pen.lineWidth = 0.35 + LINE_WIDTH * life * (0.6 + 0.4 * press);
        pen.beginPath();
        pen.moveTo(a.x, a.y);
        pen.lineTo(b.x, b.y);
        pen.stroke();
      }
      lineRaf = requestAnimationFrame(draw);
    };
    const trace = (t: number) => {
      if (still.matches || kind === "off" || kind === "tag") return;
      const last = line[line.length - 1];
      const d = last ? Math.hypot(px - last.x, py - last.y) : 0;
      if (last && d < 0.5) return;
      line.push({ x: px, y: py, t, v: last ? d / Math.max(1, t - last.t) : 0 });
      if (!lineRaf) lineRaf = requestAnimationFrame(draw);
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
      // the tag, near the right edge, opens on the stroke's other side
      el.toggleAttribute("data-flip", kind === "tag" && px + 32 + wide > html.clientWidth - 12);
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
      trace(e.timeStamp);
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
      lift = window.setTimeout(
        () => {
          delete el.dataset.neg;
        },
        Math.max(0, NEGATIVE_MIN - (performance.now() - pressedAt)),
      );
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
    addEventListener("resize", fit, { passive: true });
    addEventListener("popstate", back);
    html.addEventListener("pointerleave", leave);
    document.addEventListener("click", clicked, true);
    document.addEventListener("change", picked, true);
    document.addEventListener("vp-pick", picked, true);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(lineRaf);
      removeEventListener("resize", fit);
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
    <>
      <canvas ref={trail} className="vp-trail" aria-hidden="true" />
      <div ref={root} className="vp-cur" aria-hidden="true">
        <svg className="vp-cur__logo" viewBox={SYMBOL_VIEWBOX} focusable="false">
          <polygon className="vp-cur__rim" points={PRIMARY} />
          <polygon className="vp-cur__rim vp-cur__b" points={SECONDARY} />
          <polygon className="vp-cur__a" points={PRIMARY} />
          <polygon className="vp-cur__a vp-cur__b" points={SECONDARY} />
        </svg>
        <span ref={tag} className="vp-cur__tag t-small" />
      </div>
    </>
  );
}
