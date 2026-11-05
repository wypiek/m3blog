---
title: Shapes that morph
date: 2026-10-21
tags: [m3-expressive, design, shapes]
icon: interests
shape: cookie9
accent: tertiary
summary: M3 Expressive brings a library of playful shapes and smooth morphing between them. Here is how m3blog does it with nothing but CSS clip-path.
---

Material 3 Expressive introduced a shape library: cookies, clovers, sunny stars, pills, gems and more. Shapes aren't only decoration — they *morph*, smoothly turning one into another to show state changes.

<!-- more -->

## How it works here

Every shape is generated at build time as a polar curve and sampled into exactly 64 points. Because all shapes share the same number of points, CSS can interpolate between any two `polygon()` values:

```css
.shape-badge {
  clip-path: var(--m3-shape-cookie9);
  transition: clip-path var(--spatial-slow);
}
.post-card:hover .shape-badge {
  clip-path: var(--m3-shape-flower);
}
```

Hover any post card on the home page to see it: the badge morphs to a new shape and rotates, riding a spring with a little overshoot.

## Available shapes

`circle`, `square`, `slanted`, `arch`, `semicircle`, `oval`, `pill`, `triangle`, `diamond`, `pentagon`, `gem`, `sunny`, `verySunny`, `cookie4`, `cookie6`, `cookie7`, `cookie9`, `cookie12`, `clover4`, `clover8`, `burst`, `softBurst`, `boom`, `flower`, `puffy` and `ghostish`.

Pick one per post with the `shape` front matter field, or let m3blog choose one from the slug.

## The loading indicator

The search page uses the M3 Expressive loading indicator: a single shape that cycles through *soft burst → cookie → pentagon → pill → sunny → cookie → oval* while spinning. It's one CSS animation driven by the same shape variables.

## Corners, too

Containers follow the expanded corner scale — `large-increased` (20dp), `extra-large-increased` (32dp) and `extra-extra-large` (48dp) — and buttons change shape when pressed: round at rest, squarer under your finger.
