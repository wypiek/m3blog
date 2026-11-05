# m3blog

An open-source blog engine that's easy to set up and maintain, styled with **Material 3 Expressive**.

You write Markdown, and m3blog builds a fast static site with:

- **Dynamic color.** One seed color becomes a full M3 light and dark scheme, generated with Google's [Material Color Utilities](https://github.com/material-foundation/material-color-utilities).
- **Expressive shapes.** A shape library (cookie, clover, sunny, flower, pill, gem…) that morphs between shapes using pure CSS `clip-path`.
- **Spring motion.** The M3 Expressive spring tokens are solved at build time and turned into CSS `linear()` easings.
- **Expressive components.** Navigation rail and navigation bar, shape-morphing buttons, button groups (standard and connected), FAB, chips, outlined cards, segmented lists, a loading indicator, a wavy progress indicator, a floating toolbar, a search bar and a snackbar.
- **Blog features.** Tags, archive, pagination, client-side search, table of contents, RSS feed, sitemap, Open Graph tags, syntax highlighting, callouts, a dark-mode toggle and drafts.
- **Fast pages.** No front-end framework: the client script is about 9 KB with no dependencies.

## Quick start

```bash
git clone https://github.com/wypiek/m3blog.git my-blog
cd my-blog
npm install
npm run dev          # http://localhost:4000, live reload, drafts visible
```

Then:

1. Edit `m3blog.config.json` to set the title, author and seed color.
2. Run `npm run new "My first post"` to create a post in `content/posts/`.
3. Run `npm run build` to write the finished site to `dist/`, ready for any static host.

## Project layout

```
m3blog.config.json     Site settings and theme
content/posts/         Posts: YYYY-MM-DD-slug.md, or slug/index.md with images next to it
content/pages/         Standalone pages (about.md → /about/)
static/                Copied as-is into the site (images, CNAME, robots.txt…)
src/                   The engine (theme generators, templates, build, dev server)
```

## Configuration

| Key | Default | Notes |
| --- | --- | --- |
| `title`, `description` | | Shown in the hero, `<title>` and feeds |
| `url` | `http://localhost:4000` | Public origin used for feeds, sitemap and canonical links |
| `basePath` | `/` | Use `/repo-name/` for GitHub Pages project sites |
| `author` | | `name`, `bio`, `avatar` (path in `static/`) |
| `postsPerPage` | `9` | |
| `theme.seedColor` | `#6750A4` | Any hex color |
| `theme.variant` | `tonalSpot` | `tonalSpot`, `vibrant`, `expressive`, `content`, `fidelity`, `neutral`, `monochrome`, `rainbow`, `fruitSalad` |
| `theme.contrast` | `0` | `-1` to `1` |
| `theme.motion` | `expressive` | `expressive` (bouncier) or `standard` |
| `theme.fontBrand`, `theme.fontPlain` | `Roboto Flex` | Google Fonts family names |
| `theme.googleFonts` | `true` | Set to `false` to self-host fonts |
| `theme.logoShape` | `cookie9` | Shape used for the logo and favicon |
| `nav` | | `[{ label, href, icon }]`, where `icon` is a [Material Symbols](https://fonts.google.com/icons) name |
| `social` | `[]` | Footer links: `[{ label, href, icon }]` |

## Post front matter

```yaml
---
title: Shapes that morph
date: 2026-10-21
updated: 2026-10-25     # optional
tags: [design, motion]
summary: Shown on cards, in search and in the feed
cover: cover.jpg        # optional
icon: interests         # Material Symbol inside the shape badge
shape: cookie9          # badge shape (otherwise picked from the slug)
accent: tertiary        # primary | secondary | tertiary
toc: true               # defaults to on when a post has 3+ headings
draft: false
---
```

Put `<!-- more -->` in a post to choose where its excerpt ends. GitHub-style callouts (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`) are supported.

## Commands

| Command | |
| --- | --- |
| `npm run dev` | Dev server with live reload (`--port`, `--host`, `--no-drafts`) |
| `npm run build` | Production build into `dist/` (`--drafts` to include drafts) |
| `npm run new "Title"` | New draft post (`--page` for a page) |
| `npx m3blog init my-blog` | Scaffold a new blog in another folder |
| `npm test` | Run the test suite |

## Deploying

`dist/` is plain HTML, CSS and JS, so you can host it anywhere. The sample post `content/posts/2025-12-10-deploying-to-github-pages.md` includes a ready-to-use GitHub Pages workflow.

## A note on M3 Expressive on the web

Google's official M3 Expressive implementations target Jetpack Compose and Android. There is no official web release, and `@material/web` is in maintenance mode. m3blog therefore implements the M3 Expressive system directly in CSS: color roles, the type scale with emphasized styles, the expanded corner scale, spring motion tokens and the shape library. Components follow the M3 guidelines.

## License

MIT
