"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type SyntheticEvent } from "react";
import map from "@/content/geo/map.json";
import { Mark } from "@/components/marks/Mark";
import { useScrollTime } from "@/lib/useScrollTime";
import { LATS, LONS, placeXY, projectKm, SHEET } from "./geo";
import type { MapPin } from "./ItalyMap";
import type { MarkSpec, Scene, Shot } from "./gl/scene";

/** A stop of the chapter: the places it is about (none: all Italy), its name on the rail, its caption. */
export type ChapterStep = { key: string; focus: string[]; rail: string; caption: ReactNode };
type Gl = "wait" | "on" | "off";

// heights of the model (scene.ts H): where a label stands on it
const GROUND = { it: 7, op: 15 } as const;
// the brand slope as the camera's: the model seen at 59.6°, the places at 30.4° (90° − 59.6°)
const SLOPE = 59.6;
const MEDIA = "(min-width: 64rem) and (prefers-reduced-motion: no-preference)";
// ms between one mark rising and the next (their flags follow at the same pace: .vp-gl__flag --d)
const RISE_STAGGER = 140;
// a flag hangs this far above its mark's head (.vp-gl__tag), then on a rod as long as it must rise
const GAP = 9;
const LIFTS = [0, 30, 60, 90, 120, 150];
type Lay = { lift: number; west: boolean };

/**
 * Where each flag stands so that none covers another, as the pins of the CSS slab: the flags
 * nearest the viewer (lowest on screen) keep the short rods, those behind rise above them, and a
 * flag opens to the west when the east is taken or would leave the screen. A flag stays where it
 * is until it would touch another, and moves only to a place with room around it: nothing
 * flickers while the camera travels (the moves themselves are eased in CSS).
 */
function layFlags(pts: [number, number, boolean][], sizes: [number, number][], prev: (Lay | null)[], width: number): (Lay | null)[] {
  const out: (Lay | null)[] = pts.map(() => null);
  const boxes: [number, number, number, number][] = [];
  const order = pts.map((_, i) => i).filter((i) => pts[i][2]).sort((a, b) => pts[b][1] - pts[a][1]);
  for (const i of order) {
    const [x, y] = pts[i];
    const [w, h] = sizes[i];
    const box = ({ lift, west }: Lay) => [west ? x - w : x, y - GAP - lift - h, west ? x : x + w, y - GAP - lift] as [number, number, number, number];
    const fits = (l: Lay, room: number) => {
      const [x0, y0, x1, y1] = box(l);
      return x0 >= 8 && x1 <= width - 8 && !boxes.some(([a0, b0, a1, b1]) => x0 < a1 + room && x1 > a0 - room && y0 < b1 + room && y1 > b0 - room);
    };
    const options = LIFTS.flatMap((lift) => [false, true].map((west) => ({ lift, west })));
    const best = options.find((l) => fits(l, 4));
    const was = prev[i];
    const lay = was && fits(was, 0) && (!best || best.lift >= was.lift) ? was : (best ?? options[options.length - 2]);
    boxes.push(box(lay));
    out[i] = lay;
  }
  return out;
}

/**
 * «Dove operiamo» as a chapter of its own, on a desktop with motion: the page holds the white
 * model of Italy still (WebGL, components/map/gl/scene.ts) while the scroll moves a camera over
 * it — Italy, then the two offices, then each operation, then all the places with their list.
 * Every place's mark rises from the model as the chapter comes into view, one after another,
 * and its flag takes the camera there: a click on Milano is the scroll to the offices' stop.
 *
 * Phones, reduced motion, no scripts and no WebGL keep the slab with its list (`fallback`),
 * decided in CSS so the page never changes height once drawn: the chapter's place is held by an
 * empty block of its height, and its parts are made only on a screen that shows it (a window
 * widened into a desktop makes them then). The 3D code and the cartography load only when the
 * chapter is near.
 */
export function WhereChapter({
  pins,
  steps,
  head,
  fallback,
  stopsLabel,
}: {
  pins: MapPin[];
  steps: ChapterStep[];
  head: ReactNode;
  fallback: ReactNode;
  stopsLabel: string;
}) {
  const [on, setOn] = useState(false);
  const [gl, setGl] = useState<Gl>("wait");

  useEffect(() => {
    const mq = matchMedia(MEDIA);
    const check = () => {
      if (mq.matches && document.documentElement.classList.contains("js-motion")) setOn(true);
    };
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  return (
    <div className="vp-gl" data-gl={gl}>
      <div className="vp-gl__head container-x">{head}</div>
      {on ? (
        <ChapterRun pins={pins} steps={steps} stopsLabel={stopsLabel} gl={gl} setGl={setGl} />
      ) : (
        <div className="vp-gl__run" style={{ "--n": steps.length } as CSSProperties} />
      )}
      <div className="vp-gl__fallback">{fallback}</div>
    </div>
  );
}

/**
 * The chapter itself. The captions are an ordered list (one stop shown at a time, all of them
 * read by screen readers, a focused link brings its stop on screen); the rail jumps to any stop,
 * and so does each flag on the model, for the pointer (the rail is the same for the keyboard).
 */
function ChapterRun({ pins, steps, stopsLabel, gl, setGl }: { pins: MapPin[]; steps: ChapterStep[]; stopsLabel: string; gl: Gl; setGl: (g: Gl) => void }) {
  const n = steps.length;
  const canvas = useRef<HTMLCanvasElement>(null);
  const flagEls = useRef<(HTMLSpanElement | null)[]>([]);
  const layout = useRef<(Lay | null)[]>([]);
  const cityEls = useRef<(HTMLSpanElement | null)[]>([]);
  const scene = useRef<Scene | null>(null);
  const time = useRef<[number, number]>([0, 0]);
  const [hover, setHover] = useState<string | null>(null);
  // the marks stand once the chapter is half in view
  const [risen, setRisen] = useState(false);
  // a place chosen on the model: lit alone at its stop (an office shares the offices' stop with
  // the other) until the reader moves on from there
  const [picked, setPicked] = useState<string | null>(null);
  const pick = useRef<{ step: number; there: boolean } | null>(null);
  const { wrap, stage, active, go } = useScrollTime(n, (t, enter) => {
    time.current = [t, enter];
    scene.current?.set(t, enter);
    if (enter > 0.5) setRisen(true);
    const p = pick.current;
    if (!p) return;
    if (Math.round(t) === p.step) p.there = true;
    else if (p.there) {
      pick.current = null;
      setPicked(null);
    }
  });

  // the places on the model: a mark each, side by side when two share a town
  const places = pins.map((p) => {
    const [x, z] = placeXY(p);
    return { ...p, x, z };
  });
  const areas = [...new Set(pins.map((p) => p.area))].filter((a) => map.regions.includes(a));
  const marks: MarkSpec[] = places.map((p) => {
    const near = places.filter((q) => Math.hypot(q.x - p.x, q.z - p.z) < 8);
    const k = near.indexOf(p);
    return { key: p.key, x: p.x, z: p.z, y: areas.includes(p.area) ? GROUND.op : GROUND.it, kind: p.kind, side: near.length > 1 ? (k === 0 ? -1 : 1) : 0 };
  });
  // printed cities, except where a mark already names the town
  const cities = Object.entries(map.cities)
    .filter(([, [x, y]]) => !places.some((p) => Math.hypot(p.x - (x as number), p.z - (y as number)) < 15))
    .map(([name, [x, y, r]]) => ({ name, x: x as number, z: y as number, high: areas.includes(r as string) }));

  // the stops: where the camera stands for each
  const shots: Shot[] = steps.map((s, i) => {
    const ps = places.filter((p) => s.focus.includes(p.key));
    if (!ps.length) return { x: SHEET.x + SHEET.w / 2 + 40, z: SHEET.y + SHEET.h / 2 + 30, size: 1300, elev: SLOPE, azim: 0, shift: 0.4, fit: [0.51, 0.97] };
    const xs = ps.map((p) => p.x), zs = ps.map((p) => p.z);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
    const all = i === n - 1;
    return {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      z: (Math.min(...zs) + Math.max(...zs)) / 2,
      size: Math.max(ps.length > 1 ? 300 : 150, span * (all ? 2.3 : 2.6)),
      elev: ps.length > 1 ? (all ? 50 : 42) : 90 - SLOPE,
      azim: all ? 0 : [0, -12, 14, -9, 16, -14][i % 6],
      shift: 0.26,
    };
  });

  // the stop's own places are lit (the chosen one alone, at its stop), the others dimmed
  const focus = steps[active]?.focus ?? [];
  const chosen = picked && active !== n - 1 && focus.includes(picked) ? [picked] : null;
  const lit = hover ? [hover] : (chosen ?? (focus.length && active !== n - 1 ? focus : null));

  useEffect(() => {
    if (risen) scene.current?.rise(places.map((p) => p.key), RISE_STAGGER);
    scene.current?.light(lit);
  });

  // a flag's place: its own stop, or the offices' for an office (never the last, which is all of them)
  const choose = (key: string) => {
    const i = steps.findIndex((s, k) => k > 0 && k < n - 1 && s.focus.includes(key));
    if (i < 0) return;
    pick.current = { step: i, there: i === active };
    setPicked(key);
    go(i);
  };

  // load when the chapter is a screen and a half away; draw only while it is on screen.
  // No WebGL: the slab, decided only then, so a page that never gets here asks nothing of the GPU
  useEffect(() => {
    const el = wrap.current, cv = canvas.current;
    if (!el || !cv) return;
    let s: Scene | null = null;
    let dead = false;
    let width = cv.clientWidth;
    const sizes: [number, number][] = places.map(() => [0, 0]);
    const measure = () =>
      flagEls.current.forEach((f, i) => {
        const t = f?.firstElementChild as HTMLElement | null;
        if (t) sizes[i] = [t.offsetWidth, t.offsetHeight];
      });
    const start = async () => {
      try {
        const [{ createScene }, svg] = await Promise.all([import("./gl/scene"), fetch("/map/italia.svg").then((r) => r.text())]);
        if (dead) return;
        s = createScene({
          canvas: cv,
          svg,
          sheet: SHEET,
          areas,
          grid: { x: LONS.map((lon) => projectKm(42, lon)[0]), z: LATS.map((lat) => projectKm(lat, 12.5)[1]) },
          marks,
          shots,
          onFrame: (project, mh) => {
            // at the top of each mark, over its leaning head; the flags laid out so none covers another
            const pts = marks.map((m) => project(m.x + m.side * mh * 0.62 - 0.586 * mh, m.y + mh, m.z));
            if (sizes.some(([w]) => !w)) measure();
            const lays = layFlags(pts, sizes, layout.current, width);
            pts.forEach(([x, y, ok], i) => {
              const f = flagEls.current[i];
              if (!f) return;
              f.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
              f.style.visibility = ok ? "" : "hidden";
              const l = lays[i], was = layout.current[i];
              if (l && (l.lift !== was?.lift || l.west !== was?.west)) {
                f.style.setProperty("--lift", `${l.lift}px`);
                f.toggleAttribute("data-west", l.west);
              }
              if (l) layout.current[i] = l;
            });
            cities.forEach((c, i) => {
              const e = cityEls.current[i];
              if (!e) return;
              const [x, y, ok] = project(c.x, (c.high ? GROUND.op : GROUND.it) + 0.2, c.z);
              e.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
              e.style.visibility = ok ? "" : "hidden";
            });
          },
          onLost: () => setGl("off"),
        });
        if (!s) {
          setGl("off");
          return;
        }
        scene.current = s;
        s.set(...time.current);
        setGl("on");
      } catch {
        if (!dead) setGl("off");
      }
    };
    const near = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          near.disconnect();
          start();
        }
      },
      { rootMargin: "150% 0px" },
    );
    near.observe(el);
    const seen = new IntersectionObserver((es) => scene.current?.visible(es.some((e) => e.isIntersecting)));
    seen.observe(el);
    const ro = new ResizeObserver(() => {
      width = cv.clientWidth;
      scene.current?.resize();
    });
    ro.observe(cv);
    // the flags' sizes, read when they are drawn and again once the brand font is in
    document.fonts?.ready.then(() => !dead && measure());
    return () => {
      dead = true;
      near.disconnect();
      seen.disconnect();
      ro.disconnect();
      s?.destroy();
      scene.current = null;
    };
    // the places and stops come from the server and do not change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the list of the last stop lights its place on the model
  const onOver = (e: SyntheticEvent) => {
    const k = (e.target as HTMLElement).closest<HTMLElement>("[data-k]")?.dataset.k;
    setHover(k && places.some((p) => p.key === k) ? k : null);
  };

  return (
    <div ref={wrap} className="vp-gl__run" style={{ "--n": n } as CSSProperties}>
      <div ref={stage} className="vp-gl__stage">
        <canvas ref={canvas} className="vp-gl__canvas" aria-hidden="true" />
        {/* the labels on the model, once there is a model to stand on */}
        {gl === "on" ? (
          <div className="vp-gl__labels" aria-hidden="true">
            {cities.map((c, i) => (
              <span key={c.name} ref={(e) => void (cityEls.current[i] = e)} className="vp-gl__city" data-high={c.high ? "" : undefined}>
                <span>{c.name}</span>
              </span>
            ))}
            {places.map((p, i) => (
              <span
                key={p.key}
                ref={(e) => void (flagEls.current[i] = e)}
                className="vp-gl__flag"
                data-up={risen ? "" : undefined}
                data-dim={lit && !lit.includes(p.key) ? "" : undefined}
                style={{ "--d": i } as CSSProperties}
              >
                {/* for the pointer: the keyboard has the same stops on the rail */}
                <button
                  type="button"
                  tabIndex={-1}
                  className="vp-gl__tag"
                  onClick={() => choose(p.key)}
                  onPointerEnter={() => setHover(p.key)}
                  onPointerLeave={() => setHover(null)}
                >
                  <Mark kind={p.kind === "office" ? "solid" : "outline"} />
                  {p.label}
                  {p.note ? <span className="vp-map__note t-num">{p.note}</span> : null}
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {/* the chosen office stands out on the offices' card */}
        {chosen && focus.length > 1 ? <style>{`.vp-gl__places>li:not([data-k="${chosen[0]}"]){opacity:.42}`}</style> : null}
        <ol className="vp-gl__steps" onPointerOver={onOver} onPointerLeave={() => setHover(null)} onFocus={onOver} onBlur={() => setHover(null)}>
          {steps.map((s, i) => (
            <li key={s.key} className="vp-gl__step" data-on={i === active ? "" : undefined} onFocus={() => i !== active && go(i)}>
              {s.caption}
            </li>
          ))}
        </ol>
        <div className="vp-gl__rail" role="group" aria-label={stopsLabel}>
          {steps.map((s, i) => (
            <button key={s.key} type="button" className="vp-gl__tick t-label" aria-current={i === active ? "step" : undefined} onClick={() => go(i)}>
              {s.rail}
            </button>
          ))}
          <span className="vp-gl__progress" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
