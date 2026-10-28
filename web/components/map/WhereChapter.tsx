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

/**
 * «Dove operiamo» as a chapter of its own, on a desktop with motion: the page holds the white
 * model of Italy still (WebGL, components/map/gl/scene.ts) while the scroll moves a camera over
 * it — Italy, then the two offices, then each operation, then all the places with their list.
 * Each place's mark rises from the model when the camera first reaches it, and stays.
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
 * read by screen readers, a focused link brings its stop on screen); the rail jumps to any stop.
 */
function ChapterRun({ pins, steps, stopsLabel, gl, setGl }: { pins: MapPin[]; steps: ChapterStep[]; stopsLabel: string; gl: Gl; setGl: (g: Gl) => void }) {
  const n = steps.length;
  const canvas = useRef<HTMLCanvasElement>(null);
  const flagEls = useRef<(HTMLSpanElement | null)[]>([]);
  const cityEls = useRef<(HTMLSpanElement | null)[]>([]);
  const scene = useRef<Scene | null>(null);
  const time = useRef<[number, number]>([0, 0]);
  const [hover, setHover] = useState<string | null>(null);
  const { wrap, stage, active, go } = useScrollTime(n, (t, enter) => {
    time.current = [t, enter];
    scene.current?.set(t, enter);
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
  // a second flag in the same town stands above the first
  const stack = places.map((p, i) => places.slice(0, i).filter((q) => Math.hypot(q.x - p.x, q.z - p.z) < 8).length);
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

  // the marks reached so far stand; the stop's own places are lit, the others dimmed
  const risen = new Set(steps.slice(0, active + 1).flatMap((s) => s.focus));
  const focus = steps[active]?.focus ?? [];
  const lit = hover ? [hover] : focus.length && active !== n - 1 ? focus : null;

  useEffect(() => {
    scene.current?.rise([...risen]);
    scene.current?.light(lit);
  });

  // load when the chapter is a screen and a half away; draw only while it is on screen.
  // No WebGL: the slab, decided only then, so a page that never gets here asks nothing of the GPU
  useEffect(() => {
    const el = wrap.current, cv = canvas.current;
    if (!el || !cv) return;
    let s: Scene | null = null;
    let dead = false;
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
            marks.forEach((m, i) => {
              const f = flagEls.current[i];
              if (!f) return;
              // at the top of the mark, over its leaning head
              const [x, y, ok] = project(m.x + m.side * mh * 0.62 - 0.586 * mh, m.y + mh, m.z);
              f.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
              f.style.visibility = ok ? "" : "hidden";
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
    const ro = new ResizeObserver(() => scene.current?.resize());
    ro.observe(cv);
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
                data-up={risen.has(p.key) ? "" : undefined}
                data-dim={lit && !lit.includes(p.key) ? "" : undefined}
                style={{ "--stack": stack[i] } as CSSProperties}
              >
                <span className="vp-gl__tag">
                  <Mark kind={p.kind === "office" ? "solid" : "outline"} />
                  {p.label}
                  {p.note ? <span className="vp-map__note t-num">{p.note}</span> : null}
                </span>
              </span>
            ))}
          </div>
        ) : null}
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
