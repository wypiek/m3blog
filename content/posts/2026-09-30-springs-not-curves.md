---
title: Springs, not curves
date: 2026-09-30
tags: [m3-expressive, motion]
icon: animation
shape: clover8
accent: secondary
summary: M3 Expressive motion is physics-based. m3blog solves each spring at build time and hands the browser a CSS linear() easing.
---

Classic Material motion paired a duration with an easing curve. M3 Expressive swaps that for **springs**, described by a *damping ratio* and a *stiffness*. Springs feel natural because they behave like real objects: they can overshoot a little, and they settle on their own schedule.

<!-- more -->

## Two kinds of spring

- **Spatial** springs move things: position, size, rotation and shape. In the expressive scheme they bounce slightly.
- **Effects** springs change color and opacity. They are critically damped, so they never overshoot.

Each comes in *fast*, *default* and *slow* speeds.

| Token | Damping | Stiffness |
| --- | --- | --- |
| spatial-fast | 0.6 | 800 |
| spatial-default | 0.8 | 380 |
| spatial-slow | 0.8 | 200 |
| effects-fast | 1.0 | 3800 |
| effects-default | 1.0 | 1600 |
| effects-slow | 1.0 | 800 |

## Springs in CSS

Browsers don't have a spring timing function, but they do have `linear()`, which accepts any list of points. m3blog solves the spring equation once, samples it, and emits both the easing and the time it takes to settle:

```js
// src/theme/motion.js (simplified)
const w0 = Math.sqrt(stiffness);
const wd = w0 * Math.sqrt(1 - damping ** 2);
const x = (t) => 1 - Math.exp(-damping * w0 * t) *
  (Math.cos(wd * t) + (damping * w0 / wd) * Math.sin(wd * t));
```

The result lands in your stylesheet as tokens:

```css
.md-button {
  transition: border-radius
    var(--md-sys-motion-spring-spatial-fast-duration)
    var(--md-sys-motion-spring-spatial-fast);
}
```

Prefer calmer motion? Set `"motion": "standard"` in the theme config. Visitors who ask their OS for reduced motion get near-instant transitions automatically.
