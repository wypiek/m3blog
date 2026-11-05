import { test } from 'node:test';
import assert from 'node:assert/strict';
import { springPosition, springToCss, MOTION_SCHEMES, motionCss } from '../src/theme/motion.js';
import { SHAPE_NAMES, shapePoints, shapePolygon, SHAPE_POINTS } from '../src/theme/shapes.js';
import { colorScheme } from '../src/theme/color.js';
import { tokensCss } from '../src/theme/tokens.js';

test('springs start at 0 and settle at 1', () => {
  for (const scheme of Object.values(MOTION_SCHEMES)) {
    for (const spring of Object.values(scheme)) {
      assert.equal(springPosition(0, spring), 0);
      assert.ok(Math.abs(springPosition(5, spring) - 1) < 1e-4);
    }
  }
});

test('expressive spatial springs overshoot, effects springs do not', () => {
  const { easing } = springToCss(MOTION_SCHEMES.expressive['spatial-fast']);
  const pts = easing.slice(7, -1).split(',').map(Number);
  assert.ok(Math.max(...pts) > 1, 'spatial-fast should overshoot');
  const fx = springToCss(MOTION_SCHEMES.expressive['effects-default']).easing.slice(7, -1).split(',').map(Number);
  assert.ok(Math.max(...fx) <= 1);
  assert.equal(pts.at(-1), 1);
});

test('motionCss rejects unknown schemes', () => {
  assert.throws(() => motionCss('bouncy'), /Unknown motion scheme/);
});

test('all shapes share a point count and fit the unit box (so they can morph)', () => {
  for (const name of SHAPE_NAMES) {
    const pts = shapePoints(name);
    assert.equal(pts.length, SHAPE_POINTS, name);
    for (const [x, y] of pts) {
      assert.ok(x >= -1e-9 && x <= 1 + 1e-9 && y >= -1e-9 && y <= 1 + 1e-9, `${name} out of bounds`);
    }
    assert.match(shapePolygon(name), /^polygon\(/);
  }
});

test('color scheme derives all roles for light and dark', () => {
  const light = colorScheme('#6750A4');
  const dark = colorScheme('#6750A4', { dark: true });
  assert.match(light.primary, /^#[0-9a-f]{6}$/);
  assert.notEqual(light.surface, dark.surface);
  assert.throws(() => colorScheme('purple'), /hex color/);
  assert.throws(() => colorScheme('#6750A4', { variant: 'nope' }), /Unknown theme.variant/);
});

test('tokens stylesheet contains color, type, shape and motion tokens', () => {
  const css = tokensCss({ seedColor: '#006A60', variant: 'vibrant', motion: 'standard', fontBrand: 'Roboto Flex', fontPlain: 'Inter' });
  for (const token of ['--md-sys-color-primary:', '--md-sys-typescale-display-large-size', '--md-sys-shape-corner-extra-extra-large', '--md-sys-motion-spring-spatial-fast:', '--m3-shape-cookie9', '@keyframes m3-loading-morph', '[data-theme="dark"]']) {
    assert.ok(css.includes(token), token);
  }
});
