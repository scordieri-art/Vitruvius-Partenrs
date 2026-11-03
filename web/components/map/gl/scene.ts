import earcut from "earcut";

/**
 * «Dove operiamo» in WebGL: a plaster model of Italy with its real relief. A white board with the
 * graticule lies on the dark table of the navy page; on it the land is sculpted from the heights
 * of the open terrain data (public/map/rilievo.png), the Alps, the Apennines and the islands
 * standing up in a raking light, the vertical scale raised as on a model. The neighbouring
 * countries are a shade lighter than Italy, the regions where the group works are painted navy,
 * the lakes left flat. Every place stands as the brand mark on the ground: solid for an office, in
 * outline for an operation. When the chapter comes into view the relief rises from the flat
 * board, then the marks stand up one after another; a camera travels over the model as the page
 * scrolls, or flies to a place when one is chosen (aim).
 *
 * Plain WebGL 1, one shader, no library but earcut (triangulation of the marks). The cartography
 * is the file the slab uses (public/map/italia.svg, Natural Earth), read here once and painted
 * onto the heights' grid to colour the land. Units are the sheet's: km, x east, y south; in the
 * scene y is up and the sheet's y is z.
 */

type RGB = readonly [number, number, number];
type Ring = number[];
const rgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

// the white model on the navy page
const C = {
  navy: rgb("#0a2342"),
  sheet: rgb("#ffffff"),
  sheetEdge: rgb("#d9dfe5"),
  grat: rgb("#e3e8ec"),
  nb: rgb("#eef1f4"),
  it: rgb("#e2e7ec"),
  region: rgb("#c4ced8"),
  coast: rgb("#aebac6"),
  // the regions of the group: navy, a touch lifted so the light can model their relief
  op: rgb("#163a63"),
  opEdge: rgb("#ffffff"),
  lakeHigh: rgb("#1d3859"),
  mark: rgb("#ffffff"),
  shadow: rgb("#020a16"),
};

/** The board's thickness, km; the relief's vertical scale (a model's: the land is not this steep). */
export const H = { sheet: 16, exag: 6 } as const;

/**
 * A camera stop: what it looks at (sheet km), how much of the sheet fits the screen's height,
 * from where, and how far right the subject sits (a lens shift, -1 to 1). With `fit`, the whole
 * sheet is framed between those two fractions of the screen's width, whatever its proportions.
 */
export type Shot = { x: number; z: number; size: number; elev: number; azim: number; shift: number; fit?: [number, number] };
/** A place on the model: the mark that stands there. */
export type MarkSpec = { key: string; x: number; z: number; kind: "office" | "project"; side: number };
export type Project = (x: number, y: number, z: number) => [number, number, boolean];
/** The ground's height at a point of the sheet, km, as the model stands now. */
export type Ground = (x: number, z: number) => number;
/** The heights: one sample every `step` km over the sheet, metres (from public/map/rilievo.png). */
export type Relief = { w: number; h: number; step: number; m: Float32Array };
export type Scene = {
  /** where the scroll is: t from 0 (first stop) to n - 1, and how far the section has come in (0–1) */
  set(t: number, enter: number): void;
  /** the marks that stand up (once up, they stay), each `stagger` ms after the one before */
  rise(keys: string[], stagger?: number): void;
  /** one place lit, the others dimmed; null: all alike */
  light(keys: string[] | null): void;
  /** the camera taken to a shot of its own, over `ms`, whatever the scroll; null: back to the scroll's */
  aim(shot: Shot | null, ms?: number): void;
  visible(on: boolean): void;
  resize(): void;
  destroy(): void;
};

/** The heights in the PNG: red the high byte, green the low one, metres plus 500. */
export function readRelief(img: HTMLImageElement, step: number): Relief | null {
  const cv = document.createElement("canvas");
  cv.width = img.naturalWidth;
  cv.height = img.naturalHeight;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const m = new Float32Array(cv.width * cv.height);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4] * 256 + d[i * 4 + 1] - 500;
  return { w: cv.width, h: cv.height, step, m };
}

// ---------------------------------------------------------------- the map file

/** The layers of the map file: every <g id> with its path data. */
function paths(svg: string) {
  const out: Record<string, string> = {};
  const re = /<g id="([^"]+)"><path d="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg))) out[m[1]] = m[2];
  return out;
}

/** A layer's path as rings of x, y pairs. */
const rings = (d: string | undefined): Ring[] =>
  (d ?? "")
    .split("M")
    .filter(Boolean)
    .map((s) => {
      const r = s.replace("Z", "").split(/[L\s]+/).filter(Boolean).map(Number);
      // a ring that repeats its first point: once is enough
      if (r.length > 4 && r[0] === r[r.length - 2] && r[1] === r[r.length - 1]) r.length -= 2;
      return r;
    })
    .filter((r) => r.length >= 6);

// ---------------------------------------------------------------- geometry

const area = (r: Ring) => {
  let s = 0;
  for (let i = 0, n = r.length / 2; i < n; i++) {
    const j = (i + 1) % n;
    s += r[2 * i] * r[2 * j + 1] - r[2 * j] * r[2 * i + 1];
  }
  return s / 2;
};

/** Outward unit normals of a ring: per edge, or per vertex (the mean of its two edges) for a smooth wall. */
function normals(r: Ring, smooth: boolean) {
  const n = r.length / 2;
  const s = area(r) > 0 ? 1 : -1;
  const e: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = r[2 * j] - r[2 * i], dz = r[2 * j + 1] - r[2 * i + 1], l = Math.hypot(dx, dz) || 1;
    e.push((s * dz) / l, (-s * dx) / l);
  }
  if (!smooth) return e;
  const v: number[] = [];
  for (let i = 0; i < n; i++) {
    const h = (i + n - 1) % n;
    const x = e[2 * h] + e[2 * i], z = e[2 * h + 1] + e[2 * i + 1], l = Math.hypot(x, z) || 1;
    v.push(x / l, z / l);
  }
  return v;
}

/** Interleaved vertices: position, normal, colour with alpha. */
class Buf {
  a: number[] = [];
  v(x: number, y: number, z: number, nx: number, ny: number, nz: number, c: RGB, al = 1) {
    this.a.push(x, y, z, nx, ny, nz, c[0], c[1], c[2], al);
  }
  get n() {
    return this.a.length / 10;
  }
}

/** The board: its top just under the relief, its walls down to y0. */
function board(b: Buf, r: Ring, y0: number, y1: number) {
  for (const i of earcut(r)) b.v(r[2 * i], y1, r[2 * i + 1], 0, 1, 0, C.sheet);
  const nn = normals(r, false);
  const n = r.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ax = r[2 * i], az = r[2 * i + 1], bx = r[2 * j], bz = r[2 * j + 1], nx = nn[2 * i], nz = nn[2 * i + 1];
    b.v(ax, y0, az, nx, 0, nz, C.sheetEdge);
    b.v(bx, y0, bz, nx, 0, nz, C.sheetEdge);
    b.v(bx, y1, bz, nx, 0, nz, C.sheetEdge);
    b.v(ax, y0, az, nx, 0, nz, C.sheetEdge);
    b.v(bx, y1, bz, nx, 0, nz, C.sheetEdge);
    b.v(ax, y1, az, nx, 0, nz, C.sheetEdge);
  }
}

/** Lines over the model: each vertex at the height of the ground under it (`y` for flat ones). */
function lines(b: Buf, rs: Ring[], y: (x: number, z: number) => number, c: RGB, closed: boolean, al = 1) {
  for (const r of rs) {
    const n = r.length / 2;
    for (let i = 0; i < n - (closed ? 0 : 1); i++) {
      const j = (i + 1) % n;
      b.v(r[2 * i], y(r[2 * i], r[2 * i + 1]), r[2 * i + 1], 0, 1, 0, c, al);
      b.v(r[2 * j], y(r[2 * j], r[2 * j + 1]), r[2 * j + 1], 0, 1, 0, c, al);
    }
  }
}

/** A soft shadow along a ring: a band reaching out w km, from alpha a0 at the wall to nothing, shifted by (dx, dz) away from the light. */
function shade(b: Buf, r: Ring, y: number, w: number, a0: number, dx = 0, dz = 0) {
  const nn = normals(r, true);
  const n = r.length / 2;
  const out = (i: number): [number, number] => [r[2 * i] + nn[2 * i] * w + dx, r[2 * i + 1] + nn[2 * i + 1] * w + dz];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [ox, oz] = out(i), [px, pz] = out(j);
    const ix = r[2 * i] + dx * 0.4, iz = r[2 * i + 1] + dz * 0.4, jx = r[2 * j] + dx * 0.4, jz = r[2 * j + 1] + dz * 0.4;
    b.v(ix, y, iz, 0, 1, 0, C.shadow, a0);
    b.v(jx, y, jz, 0, 1, 0, C.shadow, a0);
    b.v(px, y, pz, 0, 1, 0, C.shadow, 0);
    b.v(ix, y, iz, 0, 1, 0, C.shadow, a0);
    b.v(px, y, pz, 0, 1, 0, C.shadow, 0);
    b.v(ox, y, oz, 0, 1, 0, C.shadow, 0);
  }
}

// the ground's classes, as painted from the map file onto the heights' grid
const SEA = 0, NB = 1, IT = 2, OP = 3, LAKE = 4, OPLAKE = 5;

/**
 * The relief as one mesh over the sheet: a vertex every `k` samples of the heights, coloured by
 * the land under it (painted from the map file: a neighbour, Italy, a region of the group, a
 * lake; the sea flat at zero), its normal from the slopes around it. Indexed, 16-bit when it fits.
 */
function terrain(R: Relief, P: Record<string, string>, areas: string[], sheet: { x: number; y: number }, k: number) {
  const W = Math.floor((R.w - 1) / k) + 1, Hh = Math.floor((R.h - 1) / k) + 1;
  // the classes, one pixel per vertex
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = Hh;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  const s = R.step * k;
  const paint = (ids: string[]) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, Hh);
    // a vertex sits on its sample's centre: half a step in from the sheet's corner
    ctx.setTransform(1 / s, 0, 0, 1 / s, -(sheet.x + R.step / 2) / s + 0.5, -(sheet.y + R.step / 2) / s + 0.5);
    ctx.fillStyle = "#fff";
    for (const id of ids) if (P[id]) ctx.fill(new Path2D(P[id]));
    return ctx.getImageData(0, 0, W, Hh).data;
  };
  const nb = paint(["neighbours"]);
  const it = paint(["italy"]);
  const op = paint(areas.map((a) => `r-${a}`));
  const lk = paint(["lakes"]);
  const olk = paint(areas.map((a) => `lakes-${a}`));
  const cls = new Uint8Array(W * Hh);
  for (let i = 0; i < cls.length; i++) {
    const a = (d: Uint8ClampedArray) => d[i * 4 + 3] > 127;
    cls[i] = a(olk) ? OPLAKE : a(op) ? OP : a(lk) && (a(it) || a(nb)) ? LAKE : a(it) ? IT : a(nb) ? NB : SEA;
  }
  // heights, km on the model: the sea and the lakes flat; smoothed twice (1-2-1 each way), so
  // the relief reads as cast plaster, not as the samples' steps
  let y = new Float32Array(W * Hh);
  for (let j = 0; j < Hh; j++)
    for (let i = 0; i < W; i++) {
      const c = cls[j * W + i];
      y[j * W + i] = c === SEA || c === LAKE || c === OPLAKE ? 0 : Math.max(0.05, (R.m[j * k * R.w + i * k] / 1000) * H.exag);
    }
  const flat = (v: number) => cls[v] === SEA || cls[v] === LAKE || cls[v] === OPLAKE;
  for (let pass = 0; pass < 2; pass++)
    for (const dir of [1, W]) {
      const o = new Float32Array(y);
      for (let v = 0; v < y.length; v++) {
        if (flat(v)) continue;
        const a = v - dir >= 0 ? y[v - dir] : y[v], b = v + dir < y.length ? y[v + dir] : y[v];
        o[v] = Math.max(0.05, (a + 2 * y[v] + b) / 4);
      }
      y = o;
    }
  const pos = new Float32Array(W * Hh * 10);
  const at = (i: number, j: number) => y[Math.min(Hh - 1, Math.max(0, j)) * W + Math.min(W - 1, Math.max(0, i))];
  for (let j = 0; j < Hh; j++)
    for (let i = 0; i < W; i++) {
      const v = j * W + i, o = v * 10;
      const nx = (at(i - 1, j) - at(i + 1, j)) / (2 * s), nz = (at(i, j - 1) - at(i, j + 1)) / (2 * s), l = Math.hypot(nx, 1, nz);
      // the colour comes from the map texture (cartography); the vertex carries white
      pos.set([sheet.x + R.step / 2 + i * s, y[v], sheet.y + R.step / 2 + j * s, nx / l, 1 / l, nz / l, 1, 1, 1, 1], o);
    }
  const n = (W - 1) * (Hh - 1) * 6;
  const idx = W * Hh > 65535 ? new Uint32Array(n) : new Uint16Array(n);
  let q = 0;
  for (let j = 0; j < Hh - 1; j++)
    for (let i = 0; i < W - 1; i++) {
      const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
      idx[q++] = a;
      idx[q++] = c;
      idx[q++] = b;
      idx[q++] = b;
      idx[q++] = c;
      idx[q++] = d;
    }
  // the ground's height at any point, bilinear between the vertices
  const ground: Ground = (x, z) => {
    const fx = (x - sheet.x - R.step / 2) / s, fz = (z - sheet.y - R.step / 2) / s;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j;
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - w) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * w;
  };
  return { pos, idx, ground };
}

/**
 * The cartography laid on the relief: the land's colours painted from the map file onto a canvas,
 * `res` km a pixel (sea white, the neighbours and Italy in two pale greys, the group's regions
 * navy, the lakes flat), sampled per pixel so the borders stay clean however close the camera.
 */
function mapTexture(P: Record<string, string>, areas: string[], sheet: { x: number; y: number; w: number; h: number }, res: number) {
  const cv = document.createElement("canvas");
  cv.width = Math.round(sheet.w / res);
  cv.height = Math.round(sheet.h / res);
  const ctx = cv.getContext("2d")!;
  const hex = (c: RGB) => `rgb(${c.map((v) => Math.round(v * 255)).join(",")})`;
  ctx.fillStyle = hex(C.sheet);
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(1 / res, 0, 0, 1 / res, -sheet.x / res, -sheet.y / res);
  const fill = (ids: string[], c: RGB) => {
    ctx.fillStyle = hex(c);
    for (const id of ids) if (P[id]) ctx.fill(new Path2D(P[id]));
  };
  fill(["neighbours"], C.nb);
  fill(["italy"], C.it);
  fill(["lakes"], C.sheet);
  fill(
    areas.map((a) => `r-${a}`),
    C.op,
  );
  fill(
    areas.map((a) => `lakes-${a}`),
    C.lakeHigh,
  );
  return cv;
}

// the brand's primary mass, one unit tall, standing on the midpoint of its foot: it leans on the slope (0.5862)
const MASS: Ring = [-0.862, 1, -0.31, 1, 0.276, 0, -0.276, 0];

/** A convex ring moved inwards by s on every side. */
function inset(r: Ring, s: number): Ring {
  const n = r.length / 2;
  const sg = area(r) > 0 ? 1 : -1;
  const L: number[][] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = r[2 * j] - r[2 * i], dy = r[2 * j + 1] - r[2 * i + 1], l = Math.hypot(dx, dy);
    L.push([r[2 * i] - (sg * dy * s) / l, r[2 * i + 1] + (sg * dx * s) / l, dx, dy]);
  }
  const out: Ring = [];
  for (let i = 0; i < n; i++) {
    const [px, py, ux, uy] = L[(i + n - 1) % n], [qx, qy, vx, vy] = L[i];
    const t = ((qx - px) * vy - (qy - py) * vx) / (ux * vy - uy * vx);
    out.push(px + ux * t, py + uy * t);
  }
  return out;
}

/** The mark as a solid of depth d, in the x-y plane (it faces south, towards the camera): solid, or a frame. */
function mark(b: Buf, outline: boolean, d: number) {
  const hole = outline ? inset(MASS, 0.085) : null;
  const data = hole ? MASS.concat(hole) : MASS;
  const tri = earcut(data, hole ? [MASS.length / 2] : null);
  for (const i of tri) b.v(data[2 * i], data[2 * i + 1], d / 2, 0, 0, 1, C.mark);
  for (const i of tri) b.v(data[2 * i], data[2 * i + 1], -d / 2, 0, 0, -1, C.mark);
  for (const [r, into] of [[MASS, false], [hole, true]] as const) {
    if (!r) continue;
    const n = r.length / 2;
    const sg = (area(r) > 0 ? 1 : -1) * (into ? -1 : 1);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ax = r[2 * i], ay = r[2 * i + 1], bx = r[2 * j], by = r[2 * j + 1];
      const l = Math.hypot(bx - ax, by - ay), nx = (sg * (by - ay)) / l, ny = (-sg * (bx - ax)) / l;
      b.v(ax, ay, -d / 2, nx, ny, 0, C.mark);
      b.v(bx, by, -d / 2, nx, ny, 0, C.mark);
      b.v(bx, by, d / 2, nx, ny, 0, C.mark);
      b.v(ax, ay, -d / 2, nx, ny, 0, C.mark);
      b.v(bx, by, d / 2, nx, ny, 0, C.mark);
      b.v(ax, ay, d / 2, nx, ny, 0, C.mark);
    }
  }
}

// ---------------------------------------------------------------- matrices (column-major)

type M4 = Float32Array;
function mul(a: M4, b: M4): M4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}
function perspective(fov: number, aspect: number, near: number, far: number, shift: number): M4 {
  const f = 1 / Math.tan(fov / 2);
  const o = new Float32Array(16);
  o[0] = f / aspect;
  o[5] = f;
  o[10] = (far + near) / (near - far);
  o[11] = -1;
  o[14] = (2 * far * near) / (near - far);
  // a lens shift: the image moves sideways, the perspective stays
  o[8] = -shift;
  return o;
}
/** The view from an eye at azimuth a (0: from the south) and elevation e (90°: straight down) over a target. */
function view(eye: number[], a: number, e: number): M4 {
  const r = [Math.cos(a), 0, -Math.sin(a)];
  const f = [-Math.sin(a) * Math.cos(e), -Math.sin(e), -Math.cos(a) * Math.cos(e)];
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const d = (p: number[]) => p[0] * eye[0] + p[1] * eye[1] + p[2] * eye[2];
  return new Float32Array([r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -d(r), -d(u), d(f), 1]);
}
function model(x: number, y: number, z: number, sx: number, sy: number, sz: number): M4 {
  return new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, x, y, z, 1]);
}
const IDENTITY = model(0, 0, 0, 1, 1, 1);

// ---------------------------------------------------------------- shader

const VS = `
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec4 aCol;
uniform mat4 uVP;
uniform mat4 uM;
uniform vec3 uL;
uniform float uLift;
uniform float uRise;
uniform vec4 uMapRect;
varying vec4 vCol;
varying float vS;
varying vec3 vPos;
varying vec2 vUV;
void main() {
  // the relief rises from the board: heights above it scaled, the slopes with them
  vec3 p = vec3(aPos.x, aPos.y > 0.0 ? aPos.y * uRise : aPos.y, aPos.z);
  vec4 w = uM * vec4(p, 1.0);
  vec3 n = normalize((uM * vec4(aNor.x * uRise, aNor.y, aNor.z * uRise, 0.0)).xyz);
  // flat ground keeps its colour exactly; slopes turned from the light darken, those towards it brighten a little
  vS = min((0.5 + 0.5 * max(dot(n, uL), 0.0)) / (0.5 + 0.5 * uL.y) + uLift, 1.12);
  vCol = aCol;
  vPos = w.xyz;
  vUV = (w.xz - uMapRect.xy) / uMapRect.zw;
  gl_Position = uVP * w;
}`;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec4 vCol;
varying float vS;
varying vec3 vPos;
varying vec2 vUV;
uniform vec3 uEye;
uniform vec3 uFog;
uniform vec2 uFogR;
uniform vec3 uRes;
uniform float uDim;
uniform float uUseMap;
uniform sampler2D uMap;
void main() {
  // the relief takes its colour from the map laid on it, everything else from its vertices
  vec3 base = mix(vCol.rgb, texture2D(uMap, clamp(vUV, 0.0, 1.0)).rgb, uUseMap);
  vec3 c = mix(min(base * vS, vec3(1.0)), uFog, uDim);
  // far away the model sinks into the navy, and the light falls off towards the edges of the frame
  c = mix(c, uFog, smoothstep(uFogR.x, uFogR.y, distance(vPos, uEye)));
  vec2 q = gl_FragCoord.xy / uRes.xy - 0.5;
  q.x *= uRes.x / uRes.y;
  c = mix(c, uFog, smoothstep(0.45, 1.2, length(q)) * uRes.z);
  gl_FragColor = vec4(c, vCol.a);
}`;

// ---------------------------------------------------------------- scene

const DEG = Math.PI / 180;
const FOV = 30 * DEG;
/** how long the relief takes to rise from the board, ms */
const RAISE = 1800;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

export function createScene({
  canvas,
  svg,
  relief,
  sheet,
  areas,
  grid,
  marks,
  shots,
  fine = true,
  onFrame,
  onLost,
}: {
  canvas: HTMLCanvasElement;
  svg: string;
  relief: Relief;
  /** the sheet, km: x, y (south), width, height */
  sheet: { x: number; y: number; w: number; h: number };
  /** regions painted navy, as named in the map file (r-<name>) */
  areas: string[];
  /** graticule: x of each meridian, z of each parallel */
  grid: { x: number[]; z: number[] };
  marks: MarkSpec[];
  shots: Shot[];
  /** every height sample a vertex (false: one in two, for a lighter mesh) */
  fine?: boolean;
  /** after each frame: place the HTML labels; mh is the marks' height, km; ground the land's height */
  onFrame: (project: Project, mh: number, ground: Ground) => void;
  onLost: () => void;
}): Scene | null {
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false, depth: true, stencil: false, powerPreference: "default" });
  if (!gl) return null;
  const big = gl.getExtension("OES_element_index_uint");

  // the model
  const P = paths(svg);
  const T = terrain(relief, P, areas, sheet, fine && big ? 1 : 2);
  const x0 = sheet.x, x1 = sheet.x + sheet.w, z0 = sheet.y, z1 = sheet.y + sheet.h;
  const edge: Ring = [x0, z0, x1, z0, x1, z1, x0, z1];
  const solid = new Buf();
  board(solid, edge, -H.sheet, -0.02);

  // lines draped on the relief: the graticule on the sea, the borders and coasts over the land
  const line = new Buf();
  const flatY = () => 0.03;
  const onGround = (x: number, z: number) => T.ground(x, z) + 0.12;
  lines(line, grid.x.map((x) => [x, z0, x, z1]), flatY, C.grat, false);
  lines(line, grid.z.map((z) => [x0, z, x1, z]), flatY, C.grat, false);
  lines(line, rings(P.regions), onGround, C.region, false);
  lines(line, rings(P.italy), onGround, C.coast, true);
  lines(line, areas.flatMap((a) => rings(P[`r-${a}`])), onGround, C.opEdge, true, 0.55);

  // the board's soft shadow on the table
  const soft = new Buf();
  shade(soft, edge, -H.sheet - 0.2, 70, 0.55, 26, 34);
  shade(soft, edge, -H.sheet - 0.1, 22, 0.35, 8, 10);

  const markSolid = new Buf();
  mark(markSolid, false, 0.26);
  const markFrame = new Buf();
  mark(markFrame, true, 0.26);

  // GPU
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const at = { pos: gl.getAttribLocation(prog, "aPos"), nor: gl.getAttribLocation(prog, "aNor"), col: gl.getAttribLocation(prog, "aCol") };
  const un = (n: string) => gl.getUniformLocation(prog, n);
  const u = {
    vp: un("uVP"),
    m: un("uM"),
    eye: un("uEye"),
    l: un("uL"),
    lift: un("uLift"),
    rise: un("uRise"),
    fog: un("uFog"),
    fogR: un("uFogR"),
    res: un("uRes"),
    dim: un("uDim"),
    mapRect: un("uMapRect"),
    useMap: un("uUseMap"),
    map: un("uMap"),
  };
  // the cartography as a texture (no mipmaps: its size is not a power of two)
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mapTexture(P, areas, sheet, fine ? 0.75 : 1.25));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u.map, 0);
  gl.uniform4f(u.mapRect, sheet.x, sheet.y, sheet.w, sheet.h);
  gl.uniform1f(u.useMap, 0);
  const upload = (data: Float32Array) => {
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buf;
  };
  const geo = (b: Buf) => ({ buf: upload(new Float32Array(b.a)), n: b.n });
  const G = { solid: geo(solid), line: geo(line), soft: geo(soft), markSolid: geo(markSolid), markFrame: geo(markFrame) };
  const land = { buf: upload(T.pos), idx: gl.createBuffer()!, n: T.idx.length, type: T.idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, land.idx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, T.idx, gl.STATIC_DRAW);
  const bind = (g: { buf: WebGLBuffer }) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, g.buf);
    gl.vertexAttribPointer(at.pos, 3, gl.FLOAT, false, 40, 0);
    gl.vertexAttribPointer(at.nor, 3, gl.FLOAT, false, 40, 12);
    gl.vertexAttribPointer(at.col, 4, gl.FLOAT, false, 40, 24);
  };
  gl.enableVertexAttribArray(at.pos);
  gl.enableVertexAttribArray(at.nor);
  gl.enableVertexAttribArray(at.col);
  // the light: low, from the west and a little in front, raking across the relief so the slopes
  // that face the camera stay bright and the ridges cast their side into shade
  const Lx = -0.72, Ly = 0.52, Lz = 0.46, Ll = Math.hypot(Lx, Ly, Lz);
  gl.uniform3f(u.l, Lx / Ll, Ly / Ll, Lz / Ll);
  gl.uniform3f(u.fog, C.navy[0], C.navy[1], C.navy[2]);
  gl.clearColor(C.navy[0], C.navy[1], C.navy[2], 1);
  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // state
  let t = 0, enter = 1, on = true, raf = 0, W = 1, Hh = 1;
  let raised = -1; // when the relief began to rise (ms), -1 before
  let lit: string[] | null = null;
  const up = new Map<string, { from: number; t0: number }>();
  const dims = new Map<string, number>(marks.map((m) => [m.key, 0]));

  // a framed stop: the sheet's width within its share of the screen (a margin for the perspective)
  type View = Omit<Shot, "fit">;
  const resolve = (s: Shot): View => {
    if (!s.fit) return s;
    const [l, r] = s.fit;
    return { ...s, size: Math.max(s.size, (sheet.w * Hh) / ((r - l) * W * 0.92)), shift: l + r - 1 };
  };
  const between = (a: View, b: View, s: number): View => ({
    x: lerp(a.x, b.x, s),
    z: lerp(a.z, b.z, s),
    size: Math.exp(lerp(Math.log(a.size), Math.log(b.size), s)),
    elev: lerp(a.elev, b.elev, s),
    azim: lerp(a.azim, b.azim, s),
    shift: lerp(a.shift, b.shift, s),
  });
  const shotAt = (time: number): View => {
    if (shots.length === 1) return resolve(shots[0]);
    const k = Math.min(Math.floor(time), shots.length - 2);
    // each stop holds a little before the camera moves on
    const s = ease(Math.min(1, Math.max(0, (time - k - 0.12) / 0.76)));
    return between(resolve(shots[k]), resolve(shots[k + 1]), s);
  };
  // a shot of its own (aim): where the camera set off from, where it goes (null: back to the scroll's), since when
  let flight: { from: View; to: View | null; t0: number; ms: number } | null = null;
  let last: View | null = null;

  const frame = (now: number) => {
    raf = 0;
    let moving = false;
    let sh = shotAt(t);
    if (flight) {
      const k = Math.min(1, Math.max(0, (now - flight.t0) / flight.ms));
      sh = between(flight.from, flight.to ?? sh, ease(k));
      if (k < 1) moving = true;
      else if (!flight.to) flight = null;
    }
    last = sh;
    // the relief rising from the board (an ease out), flat before the chapter comes in; seen
    // close, its vertical scale eases down, as a model's would to stay readable
    const rk = raised < 0 ? 0 : Math.min(1, (now - raised) / RAISE);
    const near = Math.min(1, Math.max(0, (sh.size - 220) / (1200 - 220)));
    const rise = (0.02 + 0.98 * (1 - Math.pow(1 - rk, 3))) * (0.42 + 0.58 * near * near * (3 - 2 * near));
    if (raised >= 0 && rk < 1) moving = true;
    const ground: Ground = (x, z) => T.ground(x, z) * rise;

    // coming in, the model is seen from higher up, then settles on the slope
    const elev = lerp(78, sh.elev, enter) * DEG, azim = sh.azim * DEG;
    const dist = sh.size / (2 * Math.tan(FOV / 2));
    const ty = ground(sh.x, sh.z) * 0.6;
    const eye = [sh.x + dist * Math.cos(elev) * Math.sin(azim), ty + dist * Math.sin(elev), sh.z + dist * Math.cos(elev) * Math.cos(azim)];
    const vp = mul(perspective(FOV, W / Hh, dist * 0.05, dist * 8, sh.shift), view(eye, azim, elev));

    gl.viewport(0, 0, W, Hh);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(u.vp, false, vp);
    gl.uniform3f(u.eye, eye[0], eye[1], eye[2]);
    gl.uniform2f(u.fogR, dist * 0.95, dist * 2.7);
    gl.uniform3f(u.res, W, Hh, 0.55);
    gl.uniformMatrix4fv(u.m, false, IDENTITY);
    gl.uniform1f(u.lift, 0);
    gl.uniform1f(u.dim, 0);
    gl.uniform1f(u.rise, rise);
    bind(G.solid);
    gl.drawArrays(gl.TRIANGLES, 0, G.solid.n);
    // the relief, pushed a hair back so the lines draped on it always win
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);
    gl.uniform1f(u.useMap, 1);
    bind(land);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, land.idx);
    gl.drawElements(gl.TRIANGLES, land.n, land.type, 0);
    gl.uniform1f(u.useMap, 0);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.enable(gl.BLEND);
    bind(G.line);
    gl.drawArrays(gl.LINES, 0, G.line.n);
    gl.disable(gl.BLEND);

    // the marks: a size that reads at every distance, rising from the ground one after another
    const mh = Math.min(48, Math.max(8, sh.size * 0.075));
    gl.uniform1f(u.lift, 0.14);
    gl.uniform1f(u.rise, 1);
    for (const m of marks) {
      const r = up.get(m.key);
      let k = 0;
      if (r) {
        const p = Math.min(1, Math.max(0, (now - r.t0) / 1100));
        k = lerp(r.from, 1, 1 - Math.pow(1 - p, 3));
        if (p < 1) moving = true;
      }
      // dim towards the target, smoothly
      const target = lit && !lit.includes(m.key) ? 0.62 : 0;
      const d0 = dims.get(m.key) ?? 0;
      const d = Math.abs(target - d0) < 0.01 ? target : lerp(d0, target, 0.16);
      if (d !== target) moving = true;
      dims.set(m.key, d);
      if (k <= 0.001) continue;
      gl.uniform1f(u.dim, d);
      const x = m.x + m.side * mh * 0.62;
      gl.uniformMatrix4fv(u.m, false, model(x, ground(x, m.z), m.z, mh, mh * k, mh));
      const g = m.kind === "office" ? G.markSolid : G.markFrame;
      bind(g);
      gl.drawArrays(gl.TRIANGLES, 0, g.n);
    }
    gl.uniform1f(u.lift, 0);
    gl.uniform1f(u.dim, 0);
    gl.uniformMatrix4fv(u.m, false, IDENTITY);

    gl.enable(gl.BLEND);
    gl.depthMask(false);
    bind(G.soft);
    gl.drawArrays(gl.TRIANGLES, 0, G.soft.n);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    onFrame(
      (x, y, z) => {
        const X = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
        const Y = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
        const Wc = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
        if (Wc <= 0) return [0, 0, false];
        const px = ((X / Wc) * 0.5 + 0.5) * cw, py = (0.5 - (Y / Wc) * 0.5) * ch;
        return [px, py, px > -40 && px < cw + 40 && py > -40 && py < ch + 40];
      },
      mh,
      ground,
    );
    if (moving) ask();
  };
  const ask = () => {
    if (!raf && on) raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(canvas.clientWidth * dpr));
    Hh = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== W || canvas.height !== Hh) {
      canvas.width = W;
      canvas.height = Hh;
    }
    ask();
  };
  const lost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    on = false;
    onLost();
  };
  canvas.addEventListener("webglcontextlost", lost);
  resize();

  return {
    set(nt, ne) {
      // the relief rises once the chapter is a quarter in
      if (raised < 0 && ne > 0.25) raised = performance.now();
      if (nt === t && ne === enter && raised >= 0) return;
      t = nt;
      enter = ne;
      ask();
    },
    rise(keys, stagger = 0) {
      const now = performance.now();
      let i = 0;
      for (const k of keys) if (!up.has(k)) up.set(k, { from: 0.02, t0: now + stagger * i++ });
      if (i) ask();
    },
    light(keys) {
      lit = keys;
      ask();
    },
    aim(shot, ms = 1300) {
      const from = last ?? shotAt(t);
      flight = { from, to: shot ? resolve(shot) : null, t0: performance.now(), ms };
      ask();
    },
    visible(v) {
      on = v;
      if (v) ask();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    resize,
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      on = false;
      canvas.removeEventListener("webglcontextlost", lost);
      for (const g of Object.values(G)) gl.deleteBuffer(g.buf);
      gl.deleteBuffer(land.buf);
      gl.deleteBuffer(land.idx);
      gl.deleteTexture(tex);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
