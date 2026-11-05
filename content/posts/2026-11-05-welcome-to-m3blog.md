---
title: Welcome to m3blog
date: 2026-11-05
tags: [m3blog, guide]
icon: waving_hand
shape: sunny
accent: primary
summary: Everything you need to start writing — where posts live, which front matter fields exist, and how to preview and publish your blog.
---

Welcome! This is your new blog. It's a static site: you write Markdown, m3blog turns it into fast HTML styled with Material 3 Expressive.

<!-- more -->

## Writing a post

Every Markdown file in `content/posts/` becomes a post. The quickest way to start one is:

```bash
npm run new "My first real post"
```

That creates `content/posts/2026-11-05-my-first-real-post.md` with front matter filled in. It starts as a draft, so it shows up in the dev server but not in the published site until you remove `draft: true`.

> [!TIP]
> Need images next to a post? Make a folder instead: `content/posts/my-trip/index.md` plus `content/posts/my-trip/photo.jpg`, then write `![Beach](photo.jpg)`.

## Front matter

| Field | What it does |
| --- | --- |
| `title` | Post title. |
| `date` | Publish date (`YYYY-MM-DD`). Can also come from the filename prefix. |
| `updated` | Optional "last updated" date. |
| `tags` | A list, e.g. `[design, motion]`. Each tag gets its own page. |
| `summary` | Text used on cards, in search and in the feed. Otherwise the part before `<!-- more -->` is used. |
| `cover` | Cover image path, e.g. `/images/cover.jpg` (from `static/`) or `cover.jpg` in a post folder. |
| `icon` | A [Material Symbols](https://fonts.google.com/icons) name shown inside the post's shape badge. |
| `shape` | The expressive shape for the badge: `cookie9`, `clover4`, `sunny`, `flower`… |
| `accent` | `primary`, `secondary` or `tertiary` color family for the post. |
| `toc` | `true`/`false` to force the table of contents on or off. |
| `draft` | `true` hides the post from production builds. |

## Previewing and publishing

```bash
npm install
npm run dev     # http://localhost:4000 with live reload
npm run build   # writes the finished site to dist/
```

Upload `dist/` to any static host: GitHub Pages, Netlify, Cloudflare Pages, or a plain web server.

## Callouts

Use GitHub-style alerts inside blockquotes:

> [!NOTE]
> Notes are tinted with the primary container color.

> [!WARNING]
> Warnings use the error container so they stand out.

Happy writing!
