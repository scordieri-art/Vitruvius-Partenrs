import earcut from "earcut";

/**
 * «Dove operiamo» in WebGL: Italy drawn in the brand's own marks. On the navy page the land is a
 * field of small strokes of the symbol, one every few km, the way a halftone draws a picture:
 * the neighbouring countries barely there, Italy in a pale grain, the regions where the group
 * works lit up, the lakes left empty, a fine line along the coast. Every place stands as the
 * brand mark, rising from a pool of light: solid for an office, in outline for an operation. A
 * camera travels over the field as the page scrolls; where it stops, the ground around the
 * place it shows brightens, and a light follows the pointer over it, the marks under it swelling
 * and brightening. When the chapter comes into view the field prints itself from the offices
 * outwards.
 *
 * Plain WebGL 1 (instanced arrays for the field), two small shaders, no library but earcut. The
 * cartography is the file the slab uses (public/map/italia.svg, Natural Earth), read here once
 * and rasterised onto a grid. Units are the sheet's: km, x east, y south; in the scene y is up
 * and the sheet's y is z.
 */

type RGB = readonly [number, number, number];
type Ring = number[];
const rgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

const C = {
  navy: rgb("#0a2342"),
  paper: rgb("#fafaf9"),
  mark: rgb("#ffffff"),
};

/**
 * A camera stop: what it looks at (sheet km), how much of the sheet fits the screen's height,
 * from where, and how far right the subject sits (a lens shift, -1 to 1). With `fit`, the whole
 * sheet is framed between those two fractions of the screen's width, whatever its proportions.
 * `pool`: how brightly the ground lights up around what it looks at (0: not at all).
 */
export type Shot = { x: number; z: number; size: number; elev: number; azim: number; shift: number; fit?: [number, number]; pool?: number };
/** A place on the field: the mark that stands there. */
export type MarkSpec = { key: string; x: number; z: number; y: number; kind: "office" | "project"; side: number };
export type Project = (x: number, y: number, z: number) => [number, number, boolean];
export type Scene = {
  /** where the scroll is: t from 0 (first stop) to n - 1, and how far the section has come in (0–1) */
  set(t: number, enter: number): void;
  /** the marks that stand up (once up, they stay), each `stagger` ms after the one before */
  rise(keys: string[], stagger?: number): void;
  /** one place lit, the others dimmed; null: all alike */
  light(keys: string[] | null): void;
  /** where the pointer is over the canvas, CSS px (the light follows it); null: gone */
  pointer(x: number | null, y?: number): void;
  /** the camera taken to a shot of its own, over `ms`, whatever the scroll; null: back to the scroll's */
  aim(shot: Shot | null, ms?: number): void;
  visible(on: boolean): void;
  resize(): void;
  destroy(): void;
};

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

// ---------------------------------------------------------------- the field of marks

/** km between two marks of the field; every other row is shifted by half of it */
const STEP = 4.5;
/** the classes of ground a mark stands on, as the shader reads them */
const NB = 1, IT = 2, OP = 3;

/**
 * The marks of the field: the grid over the sheet, each sample classed by the land under it
 * (painted onto a canvas, one pixel per sample: a neighbour, Italy, a region where the group
 * works; lakes cut out), and how far it lies from `origin`, 0 to 1, for the field to print
 * itself from there. Four floats a mark: x, z, class, distance.
 */
function field(P: Record<string, string>, sheet: { x: number; y: number; w: number; h: number }, areas: string[], origin: [number, number]) {
  const cols = Math.ceil(sheet.w / STEP), rows = Math.ceil(sheet.h / STEP);
  const W = cols * 2; // two pixels per column: a shifted row samples the second
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = rows;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Float32Array(0);
  const paint = (ids: string[], cut: string[]) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, rows);
    ctx.setTransform(2 / STEP, 0, 0, 1 / STEP, (-sheet.x * 2) / STEP, -sheet.y / STEP);
    ctx.fillStyle = "#fff";
    for (const id of ids) if (P[id]) ctx.fill(new Path2D(P[id]));
    ctx.globalCompositeOperation = "destination-out";
    for (const id of cut) if (P[id]) ctx.fill(new Path2D(P[id]));
    ctx.globalCompositeOperation = "source-over";
    return ctx.getImageData(0, 0, W, rows).data;
  };
  const nb = paint(["neighbours"], ["lakes"]);
  const it = paint(["italy"], ["lakes"]);
  const op = paint(
    areas.map((a) => `r-${a}`),
    ["lakes", ...areas.map((a) => `lakes-${a}`)],
  );
  const out: number[] = [];
  let far = 1;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const q = 2 * i + (j % 2);
      const k = (j * W + q) * 4 + 3;
      const cls = op[k] > 127 ? OP : it[k] > 127 ? IT : nb[k] > 127 ? NB : 0;
      if (!cls) continue;
      const x = sheet.x + (q + 0.5) * (STEP / 2), z = sheet.y + (j + 0.5) * STEP;
      const d = Math.hypot(x - origin[0], z - origin[1]);
      far = Math.max(far, d);
      out.push(x, z, cls, d);
    }
  for (let i = 3; i < out.length; i += 4) out[i] /= far;
  return new Float32Array(out);
}

/** The mark of the field, one unit tall, centred, flat on the ground: the symbol's stroke seen from above, north up. */
const MW = 93.793 / 170, MS = 99.655 / 170, MC = (MW + MS) / 2;
const CORNERS = new Float32Array([-MC, -0.5, -MC + MW, -0.5, MC, 0.5, -MC, -0.5, MC, 0.5, MC - MW, 0.5]);

// ---------------------------------------------------------------- solids and lines

const area = (r: Ring) => {
  let s = 0;
  for (let i = 0, n = r.length / 2; i < n; i++) {
    const j = (i + 1) % n;
    s += r[2 * i] * r[2 * j + 1] - r[2 * j] * r[2 * i + 1];
  }
  return s / 2;
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

function lines(b: Buf, rs: Ring[], y: number, c: RGB, al: number, closed: boolean) {
  for (const r of rs) {
    const n = r.length / 2;
    for (let i = 0; i < n - (closed ? 0 : 1); i++) {
      const j = (i + 1) % n;
      b.v(r[2 * i], y, r[2 * i + 1], 0, 1, 0, c, al);
      b.v(r[2 * j], y, r[2 * j + 1], 0, 1, 0, c, al);
    }
  }
}

/** A pool of light on the ground, one unit wide: bright at the centre, nothing at the rim. */
function pool(b: Buf, al: number) {
  const n = 40;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    b.v(0, 0, 0, 0, 1, 0, C.mark, al);
    b.v(Math.cos(a0), 0, Math.sin(a0), 0, 1, 0, C.mark, 0);
    b.v(Math.cos(a1), 0, Math.sin(a1), 0, 1, 0, C.mark, 0);
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

// ---------------------------------------------------------------- shaders

const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif`;

/** the field: a mark per instance, its strength from its ground, the print front, the pool of light and the distance */
const FIELD_VS = `
attribute vec2 aCorner;
attribute vec4 aInst;
uniform mat4 uVP;
uniform vec3 uEye;
uniform vec2 uFogR;
uniform float uSize;
uniform float uFront;
uniform vec4 uPool;
uniform vec4 uCursor;
uniform vec4 uSheet;
uniform float uZoom;
varying float vA;
void main() {
  // the print front: a mark grows from a dot as it passes
  float r = smoothstep(aInst.w - 0.06, aInst.w + 0.06, uFront);
  // under the pointer's light a mark swells a little
  float h = uCursor.w * (1.0 - smoothstep(0.0, uCursor.z, distance(aInst.xy, uCursor.xy)));
  vec2 c = aInst.xy + aCorner * uSize * mix(0.2, 1.0, r) * (1.0 + h * 0.45);
  vec3 p = vec3(c.x, 0.0, c.y);
  float cls = aInst.z;
  // seen whole, the lit regions and Italy carry more of their light (their marks are tiny then)
  float far = smoothstep(300.0, 1200.0, uZoom);
  float a = cls > 2.5 ? mix(0.3, 0.62, far) : (cls > 1.5 ? mix(0.15, 0.24, far) : 0.045);
  // the ground around the place in view lights up, most near its middle
  float d = distance(aInst.xy, uPool.xy) / uPool.z;
  float lit = uPool.w * (1.0 - smoothstep(0.0, 1.0, d)) * (0.55 + 0.45 * (1.0 - smoothstep(0.0, 0.35, d)));
  a += lit * (cls > 2.5 ? 0.62 : (cls > 1.5 ? 0.3 : 0.06));
  a += h * (cls > 2.5 ? 0.55 : (cls > 1.5 ? 0.5 : 0.14));
  // far away the field sinks into the navy; right under the camera it softens too, a depth of field
  float de = distance(p, uEye);
  a *= (1.0 - smoothstep(uFogR.x, uFogR.y, de)) * mix(0.35, 1.0, smoothstep(uFogR.x * 0.5, uFogR.x * 0.82, de));
  // no edge to the sheet: the field fades out towards it
  vec2 e = min(aInst.xy - uSheet.xy, uSheet.zw - aInst.xy);
  a *= smoothstep(0.0, 90.0, min(e.x, e.y));
  vA = a * r;
  gl_Position = uVP * vec4(p, 1.0);
}`;
const FIELD_FS = `${PRECISION}
varying float vA;
uniform vec3 uCol;
uniform vec3 uRes;
void main() {
  // the light falls off towards the edges of the frame
  vec2 q = gl_FragCoord.xy / uRes.xy - 0.5;
  q.x *= uRes.x / uRes.y;
  gl_FragColor = vec4(uCol, vA * (1.0 - smoothstep(0.45, 1.2, length(q)) * uRes.z));
}`;

/** lines, pools and the standing marks */
const SOLID_VS = `
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec4 aCol;
uniform mat4 uVP;
uniform mat4 uM;
uniform vec3 uL;
uniform float uLift;
varying vec4 vCol;
varying vec3 vPos;
void main() {
  vec4 w = uM * vec4(aPos, 1.0);
  vec3 n = normalize((uM * vec4(aNor, 0.0)).xyz);
  // tops keep their colour exactly; faces turned from the light darken
  float s = (0.56 + 0.44 * max(dot(n, uL), 0.0)) / (0.56 + 0.44 * uL.y);
  vCol = vec4(aCol.rgb * min(s + uLift, 1.0), aCol.a);
  vPos = w.xyz;
  gl_Position = uVP * w;
}`;
const SOLID_FS = `${PRECISION}
varying vec4 vCol;
varying vec3 vPos;
uniform vec3 uEye;
uniform vec3 uFog;
uniform vec2 uFogR;
uniform vec3 uRes;
uniform float uDim;
uniform float uAlpha;
void main() {
  vec3 c = mix(vCol.rgb, uFog, uDim);
  // far away and towards the edges of the frame everything sinks into the navy: a solid by its
  // colour, a line or a pool of light by its strength
  vec2 q = gl_FragCoord.xy / uRes.xy - 0.5;
  q.x *= uRes.x / uRes.y;
  float f = max(smoothstep(uFogR.x, uFogR.y, distance(vPos, uEye)), smoothstep(0.45, 1.2, length(q)) * uRes.z);
  gl_FragColor = vec4(mix(c, uFog, f), vCol.a * uAlpha * (vCol.a < 1.0 ? 1.0 - f : 1.0));
}`;

// ---------------------------------------------------------------- scene

const DEG = Math.PI / 180;
const FOV = 30 * DEG;
/** how long the field takes to print itself, ms */
const PRINT = 2400;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

export function createScene({
  canvas,
  svg,
  sheet,
  areas,
  marks,
  shots,
  onFrame,
  onLost,
}: {
  canvas: HTMLCanvasElement;
  svg: string;
  /** the sheet, km: x, y (south), width, height */
  sheet: { x: number; y: number; w: number; h: number };
  /** regions lit up, as named in the map file (r-<name>) */
  areas: string[];
  marks: MarkSpec[];
  shots: Shot[];
  /** after each frame: place the HTML labels; mh is the marks' height, km */
  onFrame: (project: Project, mh: number) => void;
  onLost: () => void;
}): Scene | null {
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false, depth: true, stencil: false, powerPreference: "default" });
  if (!gl) return null;
  const inst = gl.getExtension("ANGLE_instanced_arrays");
  if (!inst) return null;

  // the field prints itself from the offices (their middle), else from the first place
  const offices = marks.filter((m) => m.kind === "office");
  const from = offices.length ? offices : marks.slice(0, 1);
  const origin: [number, number] = from.length ? [from.reduce((s, m) => s + m.x, 0) / from.length, from.reduce((s, m) => s + m.z, 0) / from.length] : [0, 0];
  const P = paths(svg);
  const F = field(P, sheet, areas, origin);
  const count = F.length / 4;

  // the lines: Italy's coast, the lit regions' edges, the other borders faint (the neighbours
  // have none: cut at the sheet's edge, theirs would draw its frame)
  const line = new Buf();
  lines(line, rings(P.regions), 0.02, C.paper, 0.08, false);
  lines(line, rings(P.italy), 0.03, C.paper, 0.4, true);
  lines(line, areas.flatMap((a) => rings(P[`r-${a}`])), 0.04, C.paper, 0.5, true);

  const pools = new Buf();
  pool(pools, 0.3);
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
  const program = (vs: string, fs: string) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  };
  const fieldProg = program(FIELD_VS, FIELD_FS);
  const solidProg = program(SOLID_VS, SOLID_FS);
  if (!fieldProg || !solidProg) return null;
  const fa = { corner: gl.getAttribLocation(fieldProg, "aCorner"), inst: gl.getAttribLocation(fieldProg, "aInst") };
  const sa = { pos: gl.getAttribLocation(solidProg, "aPos"), nor: gl.getAttribLocation(solidProg, "aNor"), col: gl.getAttribLocation(solidProg, "aCol") };
  const fu = (n: string) => gl.getUniformLocation(fieldProg, n);
  const su = (n: string) => gl.getUniformLocation(solidProg, n);
  const U = {
    f: { vp: fu("uVP"), eye: fu("uEye"), fogR: fu("uFogR"), size: fu("uSize"), front: fu("uFront"), pool: fu("uPool"), cursor: fu("uCursor"), col: fu("uCol"), res: fu("uRes"), sheet: fu("uSheet"), zoom: fu("uZoom") },
    s: { vp: su("uVP"), m: su("uM"), l: su("uL"), lift: su("uLift"), eye: su("uEye"), fog: su("uFog"), fogR: su("uFogR"), res: su("uRes"), dim: su("uDim"), alpha: su("uAlpha") },
  };
  const upload = (data: Float32Array) => {
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buf;
  };
  const solid = (b: Buf) => ({ buf: upload(new Float32Array(b.a)), n: b.n });
  const G = { corners: upload(CORNERS), field: upload(F), line: solid(line), glow: solid(pools), markSolid: solid(markSolid), markFrame: solid(markFrame) };

  // the light on the standing marks: high, from the front left, so the faces towards the camera stay bright
  const Lx = -0.48, Ly = 0.78, Lz = 0.4, Ll = Math.hypot(Lx, Ly, Lz);
  gl.useProgram(solidProg);
  gl.uniform3f(U.s.l, Lx / Ll, Ly / Ll, Lz / Ll);
  gl.uniform3f(U.s.fog, C.navy[0], C.navy[1], C.navy[2]);
  gl.useProgram(fieldProg);
  gl.uniform3f(U.f.col, C.paper[0], C.paper[1], C.paper[2]);
  gl.uniform4f(U.f.sheet, sheet.x, sheet.y, sheet.x + sheet.w, sheet.y + sheet.h);
  gl.clearColor(C.navy[0], C.navy[1], C.navy[2], 1);

  const startSolid = () => {
    gl.useProgram(solidProg);
    gl.enableVertexAttribArray(sa.pos);
    gl.enableVertexAttribArray(sa.nor);
    gl.enableVertexAttribArray(sa.col);
  };
  const bindSolid = (g: { buf: WebGLBuffer }) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, g.buf);
    gl.vertexAttribPointer(sa.pos, 3, gl.FLOAT, false, 40, 0);
    gl.vertexAttribPointer(sa.nor, 3, gl.FLOAT, false, 40, 12);
    gl.vertexAttribPointer(sa.col, 4, gl.FLOAT, false, 40, 24);
  };

  // state
  let t = 0, enter = 1, on = true, raf = 0, W = 1, Hh = 1;
  let printed = -1; // when the field began to print itself (ms), -1 before
  let lit: string[] | null = null;
  // the pointer over the canvas (CSS px), and how bright its light is now (0–1)
  let ptr: [number, number] | null = null;
  let glow = 0;
  const up = new Map<string, { from: number; t0: number }>();
  const dims = new Map<string, number>(marks.map((m) => [m.key, 0]));

  // a framed stop: the sheet's width within its share of the screen (a margin for the perspective)
  const resolve = (s: Shot): Shot => {
    if (!s.fit) return s;
    const [l, r] = s.fit;
    return { ...s, size: Math.max(s.size, (sheet.w * Hh) / ((r - l) * W * 0.92)), shift: l + r - 1 };
  };
  type View = Required<Omit<Shot, "fit">>;
  const pin = (s: Shot): View => {
    const r = resolve(s);
    return { x: r.x, z: r.z, size: r.size, elev: r.elev, azim: r.azim, shift: r.shift, pool: s.pool ?? 0 };
  };
  /** between two views: the size on a log scale, the light dimmer on the way */
  const between = (a: View, b: View, s: number): View => ({
    x: lerp(a.x, b.x, s),
    z: lerp(a.z, b.z, s),
    size: Math.exp(lerp(Math.log(a.size), Math.log(b.size), s)),
    elev: lerp(a.elev, b.elev, s),
    azim: lerp(a.azim, b.azim, s),
    shift: lerp(a.shift, b.shift, s),
    pool: lerp(a.pool, b.pool, s) * (1 - Math.sin(s * Math.PI) * 0.6),
  });
  const shotAt = (time: number): View => {
    if (shots.length === 1) return pin(shots[0]);
    const k = Math.min(Math.floor(time), shots.length - 2);
    // each stop holds a little before the camera moves on
    const s = ease(Math.min(1, Math.max(0, (time - k - 0.12) / 0.76)));
    return between(pin(shots[k]), pin(shots[k + 1]), s);
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
    // coming in, the field is seen from higher up, then settles on the slope
    const elev = lerp(78, sh.elev, enter) * DEG, azim = sh.azim * DEG;
    const dist = sh.size / (2 * Math.tan(FOV / 2));
    const eye = [sh.x + dist * Math.cos(elev) * Math.sin(azim), dist * Math.sin(elev), sh.z + dist * Math.cos(elev) * Math.cos(azim)];
    const vp = mul(perspective(FOV, W / Hh, dist * 0.05, dist * 8, sh.shift), view(eye, azim, elev));
    const front = printed < 0 ? 0 : Math.min(1.12, ((now - printed) / PRINT) * 1.12);
    if (printed >= 0 && front < 1.12) moving = true;
    // the pointer's light: on the ground under it, through the camera as it stands now
    glow = Math.abs((ptr ? 1 : 0) - glow) < 0.01 ? (ptr ? 1 : 0) : lerp(glow, ptr ? 1 : 0, 0.18);
    if (glow !== (ptr ? 1 : 0)) moving = true;
    let cur: [number, number] = [0, 0];
    if (ptr) {
      const cw = canvas.clientWidth || 1, ch = canvas.clientHeight || 1;
      const nx = (ptr[0] / cw) * 2 - 1, ny = 1 - (ptr[1] / ch) * 2;
      const F = 1 / Math.tan(FOV / 2);
      const r = [Math.cos(azim), 0, -Math.sin(azim)];
      const f = [-Math.sin(azim) * Math.cos(elev), -Math.sin(elev), -Math.cos(azim) * Math.cos(elev)];
      const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
      const kx = ((nx - sh.shift) * (W / Hh)) / F, ky = ny / F;
      const d = [0, 1, 2].map((i) => r[i] * kx + u[i] * ky + f[i]);
      if (d[1] < -1e-4) {
        const l = -eye[1] / d[1];
        cur = [eye[0] + d[0] * l, eye[2] + d[2] * l];
      }
    }

    gl.viewport(0, 0, W, Hh);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    // the field, a mark per instance
    gl.useProgram(fieldProg);
    gl.uniformMatrix4fv(U.f.vp, false, vp);
    gl.uniform3f(U.f.eye, eye[0], eye[1], eye[2]);
    gl.uniform2f(U.f.fogR, dist * 1.05, dist * 2.9);
    gl.uniform1f(U.f.size, STEP * 0.56);
    gl.uniform1f(U.f.front, front);
    gl.uniform4f(U.f.pool, sh.x, sh.z, sh.size * 0.34, sh.pool);
    gl.uniform4f(U.f.cursor, cur[0], cur[1], sh.size * 0.1, glow);
    gl.uniform1f(U.f.zoom, sh.size);
    gl.uniform3f(U.f.res, W, Hh, 0.6);
    gl.bindBuffer(gl.ARRAY_BUFFER, G.corners);
    gl.enableVertexAttribArray(fa.corner);
    gl.vertexAttribPointer(fa.corner, 2, gl.FLOAT, false, 8, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, G.field);
    gl.enableVertexAttribArray(fa.inst);
    gl.vertexAttribPointer(fa.inst, 4, gl.FLOAT, false, 16, 0);
    inst.vertexAttribDivisorANGLE(fa.inst, 1);
    inst.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, count);
    inst.vertexAttribDivisorANGLE(fa.inst, 0);
    gl.disableVertexAttribArray(fa.inst);
    gl.disableVertexAttribArray(fa.corner);

    // the lines, then the places: a pool of light on the ground, the mark standing in it
    startSolid();
    gl.uniformMatrix4fv(U.s.vp, false, vp);
    gl.uniform3f(U.s.eye, eye[0], eye[1], eye[2]);
    gl.uniform2f(U.s.fogR, dist * 1.05, dist * 2.9);
    gl.uniform3f(U.s.res, W, Hh, 0.6);
    gl.uniformMatrix4fv(U.s.m, false, IDENTITY);
    gl.uniform1f(U.s.lift, 0);
    gl.uniform1f(U.s.dim, 0);
    gl.uniform1f(U.s.alpha, Math.min(1, front * 1.4));
    bindSolid(G.line);
    gl.drawArrays(gl.LINES, 0, G.line.n);

    // the marks: a size that reads at every distance, rising from the ground one after another
    const mh = Math.min(48, Math.max(8, sh.size * 0.075));
    const rise = marks.map((m) => {
      const r = up.get(m.key);
      if (!r) return 0;
      const p = Math.min(1, Math.max(0, (now - r.t0) / 1100));
      if (p < 1) moving = true;
      return lerp(r.from, 1, 1 - Math.pow(1 - p, 3));
    });
    const dim = marks.map((m) => {
      // dim towards the target, smoothly
      const target = lit && !lit.includes(m.key) ? 0.62 : 0;
      const d0 = dims.get(m.key) ?? 0;
      const d = Math.abs(target - d0) < 0.01 ? target : lerp(d0, target, 0.16);
      if (d !== target) moving = true;
      dims.set(m.key, d);
      return d;
    });
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    bindSolid(G.glow);
    marks.forEach((m, i) => {
      if (rise[i] <= 0.001) return;
      gl.uniform1f(U.s.alpha, rise[i] * (1 - dim[i] * 0.85));
      gl.uniformMatrix4fv(U.s.m, false, model(m.x + m.side * mh * 0.62, m.y + 0.05, m.z, mh * 1.8, 1, mh * 1.8));
      gl.drawArrays(gl.TRIANGLES, 0, G.glow.n);
    });
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.uniform1f(U.s.alpha, 1);
    gl.uniform1f(U.s.lift, 0.14);
    marks.forEach((m, i) => {
      if (rise[i] <= 0.001) return;
      gl.uniform1f(U.s.dim, dim[i]);
      gl.uniformMatrix4fv(U.s.m, false, model(m.x + m.side * mh * 0.62, m.y, m.z, mh, mh * rise[i], mh));
      const g = m.kind === "office" ? G.markSolid : G.markFrame;
      bindSolid(g);
      gl.drawArrays(gl.TRIANGLES, 0, g.n);
    });
    gl.uniform1f(U.s.lift, 0);
    gl.uniform1f(U.s.dim, 0);
    // the next frame starts with the field's attributes alone
    gl.disableVertexAttribArray(sa.pos);
    gl.disableVertexAttribArray(sa.nor);
    gl.disableVertexAttribArray(sa.col);

    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    onFrame((x, y, z) => {
      const X = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
      const Y = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
      const Wc = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
      if (Wc <= 0) return [0, 0, false];
      const px = ((X / Wc) * 0.5 + 0.5) * cw, py = (0.5 - (Y / Wc) * 0.5) * ch;
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
      // the field prints itself once the chapter is a quarter in
      if (printed < 0 && ne > 0.25) printed = performance.now();
      if (nt === t && ne === enter && printed >= 0) return;
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
    pointer(x, y = 0) {
      ptr = x === null ? null : [x, y];
      ask();
    },
    aim(shot, ms = 1300) {
      const from = last ?? shotAt(t);
      flight = { from, to: shot ? pin(shot) : null, t0: performance.now(), ms };
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
      gl.deleteBuffer(G.corners);
      gl.deleteBuffer(G.field);
      for (const g of [G.line, G.glow, G.markSolid, G.markFrame]) gl.deleteBuffer(g.buf);
      gl.deleteProgram(fieldProg);
      gl.deleteProgram(solidProg);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
