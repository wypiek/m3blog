---
title: Markdown cheatsheet
date: 2026-06-02
tags: [guide, markdown]
icon: edit_note
accent: secondary
summary: Every bit of Markdown m3blog understands, rendered with the theme so you can see how it looks.
---

m3blog uses GitHub-flavoured Markdown. This post shows each element so you can check how your theme renders it.

<!-- more -->

## Text

Write **bold**, *italic*, ~~strikethrough~~ and `inline code`. Links look [like this](https://m3.material.io).

### Lists

- Unordered lists use dashes
- Nest by indenting
  - like this
- [x] Task lists work too

1. Ordered lists
2. Count for you
3. Automatically

## Quotes

> Expressive design helps people understand and use interfaces faster, and makes them feel something along the way.

## Code

```ts
type Spring = { damping: number; stiffness: number };

export function settle(spring: Spring): number {
  return Math.round(1000 / Math.sqrt(spring.stiffness));
}
```

```json
{ "theme": { "seedColor": "#006A60", "variant": "vibrant" } }
```

## Tables

| Shape | Points | Feels |
| --- | --- | --- |
| cookie9 | 9 | Friendly |
| sunny | 8 | Bright |
| clover4 | 4 | Lucky |

## Callouts

> [!IMPORTANT]
> Important callouts use the secondary container.

> [!CAUTION]
> Caution callouts use the error container.

## Dividers

A horizontal rule becomes a little wave:

---

That's everything.
