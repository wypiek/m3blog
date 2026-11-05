// M3 Expressive shape library, approximated as polar curves.
//
// Every shape is sampled into the same number of points, starting at the same
// angle. Because CSS can interpolate between `polygon()` values that share a
// vertex count, any shape can smoothly *morph* into any other — the signature
// M3 Expressive shape-morph effect — with nothing but a `clip-path` transition.

const TAU = Math.PI * 2;
export const SHAPE_POINTS = 64;

const tri = (x) => (2 / Math.PI) * Math.asin(Math.sin(x)); // triangle wave, -1..1
const smoothMin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
};
const softPow = (x, p) => Math.sign(x) * Math.abs(x) ** p;

// Build a radius function from a dense, star-shaped outline (0 = up, clockwise).
const fromOutline = (outline) => {
  // Densify straight segments so polar interpolation keeps edges straight.
  const pts = outline.flatMap(([x, y], i) => {
    const [nx, ny] = outline[(i + 1) % outline.length];
    return Array.from({ length: 16 }, (_, k) => [x + ((nx - x) * k) / 16, y + ((ny - y) * k) / 16]);
  });
  const polar = pts
    .map(([x, y]) => [((Math.atan2(x, -y) % TAU) + TAU) % TAU, Math.hypot(x, y)])
    .sort((p, q) => p[0] - q[0]);
  polar.push([polar[0][0] + TAU, polar[0][1]]);
  polar.unshift([polar[polar.length - 2][0] - TAU, polar[polar.length - 2][1]]);
  return (a) => {
    const t = ((a % TAU) + TAU) % TAU;
    let i = 1;
    while (polar[i][0] < t) i++;
    const [a0, r0] = polar[i - 1];
    const [a1, r1] = polar[i];
    return r0 + ((r1 - r0) * (t - a0)) / (a1 - a0 || 1);
  };
};

// Regular polygon with circular corners of radius `round` (relative to circumradius 1).
const roundedPolygon = (n, round, { rotate = 0, stretchY = 1 } = {}) => {
  const pts = [];
  const verts = Array.from({ length: n }, (_, i) => rotate + (TAU * i) / n);
  const inset = 1 - round / Math.cos(Math.PI / n); // circumradius of corner centres
  for (let i = 0; i < n; i++) {
    const c = verts[i];
    const cx = Math.sin(c) * inset;
    const cy = -Math.cos(c) * inset;
    for (let k = 0; k <= 24; k++) {
      const a = c - Math.PI / n + ((TAU / n) * k) / 24;
      pts.push([cx + Math.sin(a) * round, (cy - Math.cos(a) * round) * stretchY]);
    }
  }
  return fromOutline(pts);
};

// Capsule ("stadium") of the given aspect ratio, rotated by `rotate` radians.
const stadium = (aspect, rotate) => {
  const pts = [];
  const r = 1 / aspect;
  const half = 1 - r;
  for (let k = 0; k <= 64; k++) {
    const a = (Math.PI * k) / 64;
    pts.push([half + Math.sin(a) * r, -Math.cos(a) * r]);
  }
  for (let k = 0; k <= 64; k++) {
    const a = (Math.PI * k) / 64;
    pts.push([-half - Math.sin(a) * r, Math.cos(a) * r]);
  }
  return fromOutline(pts.map(([x, y]) => [x * Math.cos(rotate) - y * Math.sin(rotate), x * Math.sin(rotate) + y * Math.cos(rotate)]));
};

// Star with rounded tips and straight flanks.
const softStar = (n, depth) => (a) => 1 + depth * Math.sin((Math.PI / 2) * tri(n * a + Math.PI / 2));

const superellipse = (n) => (a) => (Math.abs(Math.cos(a)) ** n + Math.abs(Math.sin(a)) ** n) ** (-1 / n);

/** Radius functions r(angle). Angle 0 points up, increasing clockwise. */
export const SHAPES = {
  circle: () => 1,
  square: superellipse(5),
  slanted: (a) => superellipse(5)(a + 0.12) * (1 + 0.05 * Math.sin(2 * a)),
  arch: (a) => (Math.cos(a) > 0 ? 1 : superellipse(6)(a)),
  semicircle: (a) => (Math.cos(a) > 0 ? 1 : smoothMin(1, 0.42 / Math.max(1e-6, -Math.cos(a)), 0.12)),
  oval: (a) => 1 / Math.sqrt((Math.sin(a + 0.8) / 1) ** 2 + (Math.cos(a + 0.8) / 0.72) ** 2),
  pill: stadium(1.9, -Math.PI / 4),
  triangle: roundedPolygon(3, 0.32),
  diamond: roundedPolygon(4, 0.24, { stretchY: 1.25 }),
  pentagon: roundedPolygon(5, 0.24),
  gem: roundedPolygon(6, 0.22, { stretchY: 1.15 }),
  sunny: softStar(8, 0.08),
  verySunny: softStar(8, 0.16),
  cookie4: (a) => 1 + 0.09 * Math.cos(4 * a),
  cookie6: (a) => 1 + 0.07 * Math.cos(6 * a),
  cookie7: (a) => 1 + 0.065 * Math.cos(7 * a),
  cookie9: (a) => 1 + 0.055 * Math.cos(9 * a),
  cookie12: (a) => 1 + 0.045 * Math.cos(12 * a),
  clover4: (a) => 0.62 + 0.38 * Math.abs(Math.cos(2 * a)) ** 0.45,
  clover8: (a) => 0.78 + 0.22 * Math.abs(Math.cos(4 * a)) ** 0.5,
  burst: (a) => 1 + 0.16 * softPow(tri(12 * a + Math.PI / 2), 0.9),
  softBurst: softStar(10, 0.12),
  boom: (a) => 1 + 0.22 * softPow(tri(15 * a + Math.PI / 2), 0.7),
  flower: (a) => 0.82 + 0.18 * Math.abs(Math.cos(4 * a)) ** 0.7,
  puffy: (a) => 0.88 + 0.12 * Math.abs(Math.cos(6 * a)) ** 0.6,
  ghostish: (a) => (Math.cos(a) > 0 ? 1 : superellipse(5)(a) * (1 - 0.05 * Math.abs(Math.sin(6 * a)))),
};

export const SHAPE_NAMES = Object.keys(SHAPES);

/** Points in a 0..1 box, centred and scaled to fill it. */
export function shapePoints(name, count = SHAPE_POINTS) {
  const r = SHAPES[name];
  if (!r) throw new Error(`Unknown shape "${name}". Available: ${SHAPE_NAMES.join(', ')}`);
  const raw = [];
  for (let i = 0; i < count; i++) {
    const a = (TAU * i) / count; // 0 = up, clockwise
    const rad = r(a);
    raw.push([Math.sin(a) * rad, -Math.cos(a) * rad]);
  }
  const xs = raw.map((p) => p[0]);
  const ys = raw.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = 1 / Math.max(maxX - minX, maxY - minY);
  const offX = (1 - (maxX - minX) * scale) / 2;
  const offY = (1 - (maxY - minY) * scale) / 2;
  return raw.map(([x, y]) => [offX + (x - minX) * scale, offY + (y - minY) * scale]);
}

const pct = (n) => `${Number((n * 100).toFixed(2))}%`;

/** CSS `polygon()` for a shape (animatable between any two shapes). */
export function shapePolygon(name) {
  return `polygon(${shapePoints(name).map(([x, y]) => `${pct(x)} ${pct(y)}`).join(', ')})`;
}

/** SVG path data for a shape in a `size`×`size` viewBox (smoothed with quadratic midpoints). */
export function shapePath(name, size = 100) {
  const pts = shapePoints(name, 128).map(([x, y]) => [x * size, y * size]);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f = (n) => Number(n.toFixed(2));
  const start = mid(pts[pts.length - 1], pts[0]);
  let d = `M${f(start[0])} ${f(start[1])}`;
  for (let i = 0; i < pts.length; i++) {
    const m = mid(pts[i], pts[(i + 1) % pts.length]);
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return `${d}Z`;
}

// Shape sequence used by the M3 Expressive loading indicator.
export const LOADING_SEQUENCE = ['softBurst', 'cookie9', 'pentagon', 'pill', 'sunny', 'cookie4', 'oval'];

export function shapesCss() {
  const vars = SHAPE_NAMES.map((n) => `  --m3-shape-${n}: ${shapePolygon(n)};`).join('\n');
  const classes = SHAPE_NAMES.map((n) => `.m3-shape-${n} { --m3-shape: var(--m3-shape-${n}); }`).join('\n');
  const steps = LOADING_SEQUENCE.length;
  const frames = [...LOADING_SEQUENCE, LOADING_SEQUENCE[0]]
    .map((n, i) => `  ${Number(((i / steps) * 100).toFixed(2))}% { clip-path: var(--m3-shape-${n}); transform: rotate(${i * (360 / steps) * 1.5}deg); }`)
    .join('\n');
  return { vars, classes, keyframes: `@keyframes m3-loading-morph {\n${frames}\n}` };
}
