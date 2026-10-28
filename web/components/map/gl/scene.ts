import earcut from "earcut";

/**
 * «Dove operiamo» in WebGL: the white model of the home page (the CSS slab of ItalyMap) built as
 * a real model — a white board with the graticule, the neighbouring countries barely raised,
 * Italy as a pale block, the regions where the group works raised higher in navy — lit like a
 * model on a dark table, and a camera that travels over it as the page scrolls. Every place
 * stands as the brand mark, rising from the ground when the camera reaches it: solid for an
 * office, in outline for an operation.
 *
 * Plain WebGL 1, one shader, no library but earcut (triangulation). The cartography is the
 * same file the slab uses (public/map/italia.svg, Natural Earth), read here once. Units are
 * the sheet's: km, x east, y south; in the scene y is up and the sheet's y is z.
 */

type RGB = readonly [number, number, number];
type Ring = number[];
const rgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

// the white model on the navy page: the palette of `.vp-where[data-theme="navy"] .vp-map__stage`
const C = {
  navy: rgb("#0a2342"),
  sheet: rgb("#ffffff"),
  sheetEdge: rgb("#d9dfe5"),
  grat: rgb("#e6eaee"),
  nbTop: rgb("#f1f3f5"),
  nbSide: rgb("#e2e6ea"),
  itTop: rgb("#dfe5eb"),
  itSide: rgb("#c6cfd8"),
  itEdge: rgb("#f5f7f9"),
  region: rgb("#c9d2db"),
  opTop: rgb("#0a2342"),
  opSide: rgb("#061a33"),
  opEdge: rgb("#45586f"),
  mark: rgb("#ffffff"),
  // water on the navy regions: a lighter navy, not the sheet showing through
  lakeHigh: rgb("#1d3859"),
  shadow: rgb("#020a16"),
};

/** Heights, km (a model's, not the land's): the board's thickness, then each raised layer. */
export const H = { sheet: 16, nb: 2.2, it: 7, op: 15 } as const;

/**
 * A camera stop: what it looks at (sheet km), how much of the sheet fits the screen's height,
 * from where, and how far right the subject sits (a lens shift, -1 to 1). With `fit`, the whole
 * sheet is framed between those two fractions of the screen's width, whatever its proportions.
 */
export type Shot = { x: number; z: number; size: number; elev: number; azim: number; shift: number; fit?: [number, number] };
/** A place on the model: the mark that stands there. */
export type MarkSpec = { key: string; x: number; z: number; y: number; kind: "office" | "project"; side: number };
export type Project = (x: number, y: number, z: number) => [number, number, boolean];
export type Scene = {
  /** where the scroll is: t from 0 (first stop) to n - 1, and how far the section has come in (0–1) */
  set(t: number, enter: number): void;
  /** the marks that stand up (once up, they stay) */
  rise(keys: string[]): void;
  /** one place lit, the others dimmed; null: all alike */
  light(keys: string[] | null): void;
  visible(on: boolean): void;
  resize(): void;
  destroy(): void;
};

// ---------------------------------------------------------------- geometry

/** The layers of the map file: every <g id> with its path, as rings of x, y pairs. */
function layers(svg: string) {
  const out: Record<string, Ring[]> = {};
  const re = /<g id="([^"]+)"><path d="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg))) {
    out[m[1]] = m[2]
      .split("M")
      .filter(Boolean)
      .map((s) => {
        const r = s.replace("Z", "").split(/[L\s]+/).filter(Boolean).map(Number);
        // a ring that repeats its first point: once is enough
        if (r.length > 4 && r[0] === r[r.length - 2] && r[1] === r[r.length - 1]) r.length -= 2;
        return r;
      })
      .filter((r) => r.length >= 6);
  }
  return out;
}

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

const inRing = (x: number, z: number, r: Ring) => {
  let c = false;
  for (let i = 0, n = r.length / 2, j = n - 1; i < n; j = i++) {
    const xi = r[2 * i], zi = r[2 * i + 1], xj = r[2 * j], zj = r[2 * j + 1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
};

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

/** Rings on the sheet raised from y0 to y1: the top, and the walls. */
function block(b: Buf, rings: Ring[], y0: number, y1: number, top: RGB, side: RGB, smooth = true) {
  for (const r of rings) {
    for (const i of earcut(r)) b.v(r[2 * i], y1, r[2 * i + 1], 0, 1, 0, top);
    const nn = normals(r, smooth);
    const n = r.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      // flat walls take the edge's normal at both ends
      const c = smooth ? j : i;
      const ax = r[2 * i], az = r[2 * i + 1], bx = r[2 * j], bz = r[2 * j + 1];
      const anx = nn[2 * i], anz = nn[2 * i + 1], bnx = nn[2 * c], bnz = nn[2 * c + 1];
      b.v(ax, y0, az, anx, 0, anz, side);
      b.v(bx, y0, bz, bnx, 0, bnz, side);
      b.v(bx, y1, bz, bnx, 0, bnz, side);
      b.v(ax, y0, az, anx, 0, anz, side);
      b.v(bx, y1, bz, bnx, 0, bnz, side);
      b.v(ax, y1, az, anx, 0, anz, side);
    }
  }
}

function flat(b: Buf, rings: Ring[], y: number, c: RGB) {
  for (const r of rings) for (const i of earcut(r)) b.v(r[2 * i], y, r[2 * i + 1], 0, 1, 0, c);
}

function lines(b: Buf, rings: Ring[], y: number, c: RGB, closed: boolean) {
  for (const r of rings) {
    const n = r.length / 2;
    for (let i = 0; i < n - (closed ? 0 : 1); i++) {
      const j = (i + 1) % n;
      b.v(r[2 * i], y, r[2 * i + 1], 0, 1, 0, c);
      b.v(r[2 * j], y, r[2 * j + 1], 0, 1, 0, c);
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
uniform vec3 uEye;
uniform vec3 uL;
uniform float uLift;
varying vec4 vCol;
varying vec3 vPos;
void main() {
  vec4 w = uM * vec4(aPos, 1.0);
  vec3 n = normalize((uM * vec4(aNor, 0.0)).xyz);
  // tops keep their colour exactly; walls turned from the light darken
  float s = (0.56 + 0.44 * max(dot(n, uL), 0.0)) / (0.56 + 0.44 * uL.y);
  vCol = vec4(aCol.rgb * min(s + uLift, 1.0), aCol.a);
  vPos = w.xyz;
  gl_Position = uVP * w;
}`;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec4 vCol;
varying vec3 vPos;
uniform vec3 uEye;
uniform vec3 uFog;
uniform vec2 uFogR;
uniform vec3 uRes;
uniform float uDim;
void main() {
  vec3 c = mix(vCol.rgb, uFog, uDim);
  // far away the model sinks into the navy, and the light falls off towards the edges of the frame
  // (the distance per pixel: the board is one quad a thousand km wide)
  c = mix(c, uFog, smoothstep(uFogR.x, uFogR.y, distance(vPos, uEye)));
  vec2 q = gl_FragCoord.xy / uRes.xy - 0.5;
  q.x *= uRes.x / uRes.y;
  c = mix(c, uFog, smoothstep(0.45, 1.2, length(q)) * uRes.z);
  gl_FragColor = vec4(c, vCol.a);
}`;

// ---------------------------------------------------------------- scene

const DEG = Math.PI / 180;
const FOV = 30 * DEG;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

export function createScene({
  canvas,
  svg,
  sheet,
  areas,
  grid,
  marks,
  shots,
  onFrame,
  onLost,
}: {
  canvas: HTMLCanvasElement;
  svg: string;
  /** the sheet, km: x, y (south), width, height */
  sheet: { x: number; y: number; w: number; h: number };
  /** regions raised in navy, as named in the map file (r-<name>) */
  areas: string[];
  /** graticule: x of each meridian, z of each parallel */
  grid: { x: number[]; z: number[] };
  marks: MarkSpec[];
  shots: Shot[];
  /** after each frame: place the HTML labels; mh is the marks' height, km */
  onFrame: (project: Project, mh: number) => void;
  onLost: () => void;
}): Scene | null {
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false, depth: true, stencil: false, powerPreference: "default" });
  if (!gl) return null;

  // the model
  const L = layers(svg);
  const solid = new Buf();
  const x0 = sheet.x, x1 = sheet.x + sheet.w, z0 = sheet.y, z1 = sheet.y + sheet.h;
  const board: Ring = [x0, z0, x1, z0, x1, z1, x0, z1];
  block(solid, [board], -H.sheet, 0, C.sheet, C.sheetEdge, false);
  block(solid, L.neighbours ?? [], 0, H.nb, C.nbTop, C.nbSide);
  const italy = L.italy ?? [];
  block(solid, italy, 0, H.it, C.itTop, C.itSide);
  const raised = areas.flatMap((a) => L[`r-${a}`] ?? []);
  block(solid, raised, H.it, H.op, C.opTop, C.opSide);
  // lakes on the land that holds them: Italy's, the neighbours', and those of the raised regions on top
  for (const r of L.lakes ?? []) {
    let cx = 0, cz = 0;
    for (let i = 0; i < r.length; i += 2) {
      cx += r[i];
      cz += r[i + 1];
    }
    cx /= r.length / 2;
    cz /= r.length / 2;
    flat(solid, [r], (italy.some((it) => inRing(cx, cz, it)) ? H.it : H.nb) + 0.05, C.sheet);
  }
  for (const a of areas) flat(solid, L[`lakes-${a}`] ?? [], H.op + 0.05, C.lakeHigh);

  const line = new Buf();
  const gx: Ring[] = grid.x.map((x) => [x, z0, x, z1]);
  const gz: Ring[] = grid.z.map((z) => [x0, z, x1, z]);
  lines(line, [...gx, ...gz], 0.04, C.grat, false);
  lines(line, L.regions ?? [], H.it + 0.04, C.region, false);
  lines(line, italy, H.it + 0.04, C.itEdge, true);
  lines(line, raised, H.op + 0.04, C.opEdge, true);

  // soft shadows: the board on the table, Italy on the board, the raised regions on Italy
  const soft = new Buf();
  shade(soft, board, -H.sheet - 0.2, 70, 0.55, 26, 34);
  shade(soft, board, -H.sheet - 0.1, 22, 0.35, 8, 10);
  for (const r of italy) shade(soft, r, 0.06, 7, 0.16, 1.5, 2);
  for (const r of raised) shade(soft, r, H.it + 0.06, 5, 0.22, 1, 1.5);

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
  const u = { vp: un("uVP"), m: un("uM"), eye: un("uEye"), l: un("uL"), lift: un("uLift"), fog: un("uFog"), fogR: un("uFogR"), res: un("uRes"), dim: un("uDim") };
  const upload = (b: Buf) => {
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(b.a), gl.STATIC_DRAW);
    return { buf, n: b.n };
  };
  const G = { solid: upload(solid), line: upload(line), soft: upload(soft), markSolid: upload(markSolid), markFrame: upload(markFrame) };
  const bind = (g: { buf: WebGLBuffer }) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, g.buf);
    gl.vertexAttribPointer(at.pos, 3, gl.FLOAT, false, 40, 0);
    gl.vertexAttribPointer(at.nor, 3, gl.FLOAT, false, 40, 12);
    gl.vertexAttribPointer(at.col, 4, gl.FLOAT, false, 40, 24);
  };
  gl.enableVertexAttribArray(at.pos);
  gl.enableVertexAttribArray(at.nor);
  gl.enableVertexAttribArray(at.col);
  // the light: high, from the front left, so the walls that face the camera stay bright
  const Lx = -0.48, Ly = 0.78, Lz = 0.4, Ll = Math.hypot(Lx, Ly, Lz);
  gl.uniform3f(u.l, Lx / Ll, Ly / Ll, Lz / Ll);
  gl.uniform3f(u.fog, C.navy[0], C.navy[1], C.navy[2]);
  gl.clearColor(C.navy[0], C.navy[1], C.navy[2], 1);
  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // state
  let t = 0, enter = 1, on = true, raf = 0, W = 1, Hh = 1;
  let lit: string[] | null = null;
  const up = new Map<string, { from: number; t0: number }>();
  const dims = new Map<string, number>(marks.map((m) => [m.key, 0]));

  // a framed stop: the sheet's width within its share of the screen (a margin for the perspective)
  const resolve = (s: Shot): Shot => {
    if (!s.fit) return s;
    const [l, r] = s.fit;
    return { ...s, size: Math.max(s.size, (sheet.w * Hh) / ((r - l) * W * 0.92)), shift: l + r - 1 };
  };
  const shotAt = (time: number): Shot => {
    if (shots.length === 1) return resolve(shots[0]);
    const k = Math.min(Math.floor(time), shots.length - 2);
    // each stop holds a little before the camera moves on
    const s = ease(Math.min(1, Math.max(0, (time - k - 0.12) / 0.76)));
    const a = resolve(shots[k]), b = resolve(shots[k + 1]);
    return {
      x: lerp(a.x, b.x, s),
      z: lerp(a.z, b.z, s),
      size: Math.exp(lerp(Math.log(a.size), Math.log(b.size), s)),
      elev: lerp(a.elev, b.elev, s),
      azim: lerp(a.azim, b.azim, s),
      shift: lerp(a.shift, b.shift, s),
    };
  };

  const frame = (now: number) => {
    raf = 0;
    const sh = shotAt(t);
    // coming in, the model is seen from higher up, then settles on the slope
    const elev = lerp(78, sh.elev, enter) * DEG, azim = sh.azim * DEG;
    const dist = sh.size / (2 * Math.tan(FOV / 2));
    const ty = lerp(H.it, H.op, Math.min(1, 700 / sh.size - 0.4));
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
    bind(G.solid);
    gl.drawArrays(gl.TRIANGLES, 0, G.solid.n);
    bind(G.line);
    gl.drawArrays(gl.LINES, 0, G.line.n);

    // the marks: a size that reads at every distance, rising from the ground when they are reached
    const mh = Math.min(48, Math.max(8, sh.size * 0.075));
    let moving = false;
    gl.uniform1f(u.lift, 0.14);
    for (const m of marks) {
      const r = up.get(m.key);
      let k = 0;
      if (r) {
        const p = Math.min(1, (now - r.t0) / 1100);
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
      gl.uniformMatrix4fv(u.m, false, model(m.x + m.side * mh * 0.62, m.y, m.z, mh, mh * k, mh));
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
    onFrame((x, y, z) => {
      const X = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
      const Y = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
      const Wc = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
      if (Wc <= 0) return [0, 0, false];
      const px = (X / Wc * 0.5 + 0.5) * cw, py = (0.5 - (Y / Wc) * 0.5) * ch;
      return [px, py, px > -40 && px < cw + 40 && py > -40 && py < ch + 40];
    }, mh);
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
      if (nt === t && ne === enter) return;
      t = nt;
      enter = ne;
      ask();
    },
    rise(keys) {
      const now = performance.now();
      let any = false;
      for (const k of keys)
        if (!up.has(k)) {
          up.set(k, { from: 0.02, t0: now });
          any = true;
        }
      if (any) ask();
    },
    light(keys) {
      lit = keys;
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
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
