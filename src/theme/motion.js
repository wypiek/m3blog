// M3 Expressive motion: physics-based springs, rendered to CSS `linear()` easings.
//
// Material 3 Expressive replaces duration/easing pairs with springs described by
// a damping ratio and a stiffness. Browsers can't run springs natively, so we
// solve the spring once at build time and sample it into a `linear()` easing
// function plus the matching settle duration.

// Values from the M3 motion scheme tokens (Compose `MotionScheme.expressive()`
// and `MotionScheme.standard()`). Spatial springs move things (position, size,
// shape) and may overshoot; effects springs change color/opacity and never do.
export const MOTION_SCHEMES = {
  expressive: {
    'spatial-fast': { damping: 0.6, stiffness: 800 },
    'spatial-default': { damping: 0.8, stiffness: 380 },
    'spatial-slow': { damping: 0.8, stiffness: 200 },
    'effects-fast': { damping: 1, stiffness: 3800 },
    'effects-default': { damping: 1, stiffness: 1600 },
    'effects-slow': { damping: 1, stiffness: 800 },
  },
  standard: {
    'spatial-fast': { damping: 0.9, stiffness: 1400 },
    'spatial-default': { damping: 0.9, stiffness: 700 },
    'spatial-slow': { damping: 0.9, stiffness: 300 },
    'effects-fast': { damping: 1, stiffness: 3800 },
    'effects-default': { damping: 1, stiffness: 1600 },
    'effects-slow': { damping: 1, stiffness: 800 },
  },
};

/** Position (0 → 1) of a unit-mass spring released from rest at time t (seconds). */
export function springPosition(t, { damping, stiffness }) {
  const w0 = Math.sqrt(stiffness);
  if (damping < 1) {
    const wd = w0 * Math.sqrt(1 - damping * damping);
    const env = Math.exp(-damping * w0 * t);
    return 1 - env * (Math.cos(wd * t) + ((damping * w0) / wd) * Math.sin(wd * t));
  }
  if (damping === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const r1 = -w0 * (damping - Math.sqrt(damping * damping - 1));
  const r2 = -w0 * (damping + Math.sqrt(damping * damping - 1));
  const c2 = r1 / (r2 - r1);
  const c1 = -1 - c2;
  return 1 + c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
}

/** Time (seconds) after which the spring stays within `threshold` of rest. */
export function springSettleTime(spring, threshold = 0.002) {
  const step = 1 / 1000;
  let last = 0;
  for (let t = 0; t < 5; t += step) {
    if (Math.abs(springPosition(t, spring) - 1) > threshold) last = t;
  }
  return Math.max(last + step, step);
}

const round = (n, d = 4) => Number(n.toFixed(d));

/** Convert a spring into `{ easing: 'linear(...)', duration: ms }`. */
export function springToCss(spring, samples = 48) {
  const settle = springSettleTime(spring);
  const points = [];
  for (let i = 0; i <= samples; i++) {
    const p = i === samples ? 1 : springPosition((settle * i) / samples, spring);
    points.push(round(p));
  }
  return { easing: `linear(${points.join(', ')})`, duration: Math.round(settle * 1000) };
}

/** CSS custom properties for a motion scheme. */
export function motionCss(schemeName = 'expressive') {
  const scheme = MOTION_SCHEMES[schemeName];
  if (!scheme) throw new Error(`Unknown motion scheme "${schemeName}". Use: ${Object.keys(MOTION_SCHEMES).join(', ')}`);
  const lines = [];
  for (const [name, spring] of Object.entries(scheme)) {
    const { easing, duration } = springToCss(spring);
    lines.push(`  --md-sys-motion-spring-${name}: ${easing};`);
    lines.push(`  --md-sys-motion-spring-${name}-duration: ${duration}ms;`);
  }
  return lines.join('\n');
}
