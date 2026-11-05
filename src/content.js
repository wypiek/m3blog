import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { renderMarkdown, stripMarkdown, slugify } from './markdown.js';
import { SHAPE_NAMES } from './theme/shapes.js';

// Shapes that look good as decorative post badges.
const BADGE_SHAPES = ['cookie9', 'cookie7', 'clover4', 'clover8', 'sunny', 'verySunny', 'softBurst', 'flower', 'puffy', 'pentagon', 'gem', 'arch', 'cookie12', 'pill', 'oval', 'burst'];
const BADGE_COLORS = ['primary', 'secondary', 'tertiary'];

const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})-/;

function walkMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const index = path.join(full, 'index.md');
      if (fs.existsSync(index)) out.push({ file: index, name: entry.name, bundleDir: full });
    } else if (entry.name.endsWith('.md')) {
      out.push({ file: full, name: entry.name.replace(/\.md$/, ''), bundleDir: null });
    }
  }
  return out;
}

function toDate(value, file, field) {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) throw new Error(`${file}: "${field}" is not a valid date (${value})`);
  return d;
}

function readingTime(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 220)) };
}

function parseEntry({ file, name, bundleDir }, config, kind) {
  const raw = fs.readFileSync(file, 'utf8');
  let parsed;
  try {
    parsed = matter(raw);
  } catch (err) {
    throw new Error(`${file}: invalid front matter — ${err.message}`);
  }
  const fm = parsed.data ?? {};
  const prefix = DATE_PREFIX.exec(name);
  const slug = slugify(fm.slug ?? name.replace(DATE_PREFIX, ''));
  const title = fm.title ? String(fm.title) : name.replace(DATE_PREFIX, '').replace(/[-_]+/g, ' ');
  const resolveUrl = (u) => (u.startsWith('/') && !u.startsWith('//') ? config.basePath + u.slice(1) : u);
  const [beforeMore] = parsed.content.split(/<!--\s*more\s*-->/);
  const { html, headings } = renderMarkdown(parsed.content, { resolveUrl });
  const plain = stripMarkdown(parsed.content);
  const excerptSource = fm.summary ?? (beforeMore !== parsed.content ? stripMarkdown(beforeMore) : plain);
  const excerpt = excerptSource.length > 220 ? `${excerptSource.slice(0, 217).replace(/\s+\S*$/, '')}…` : excerptSource;
  const date = toDate(fm.date ?? prefix?.[1], file, 'date');
  if (kind === 'post' && !date) throw new Error(`${file}: posts need a "date" in front matter (or a YYYY-MM-DD- filename prefix)`);
  if (fm.shape && !SHAPE_NAMES.includes(fm.shape)) throw new Error(`${file}: unknown shape "${fm.shape}". Available: ${SHAPE_NAMES.join(', ')}`);
  const tags = [].concat(fm.tags ?? []).map((t) => String(t).trim()).filter(Boolean);
  const h = hash(slug);
  return {
    kind,
    file,
    bundleDir,
    slug,
    title,
    date,
    updated: toDate(fm.updated, file, 'updated'),
    tags: tags.map((name) => ({ name, slug: slugify(name) })),
    draft: fm.draft === true,
    summary: excerpt,
    plain,
    html,
    headings,
    toc: fm.toc ?? headings.length >= 3,
    cover: fm.cover ? resolveUrl(String(fm.cover)) : null,
    coverAlt: fm.coverAlt ?? '',
    icon: fm.icon ?? null,
    shape: fm.shape ?? BADGE_SHAPES[h % BADGE_SHAPES.length],
    accent: fm.accent ?? BADGE_COLORS[(h >> 4) % BADGE_COLORS.length],
    featured: fm.featured === true,
    navIcon: fm.navIcon ?? null,
    ...readingTime(plain),
  };
}

export function loadContent(config, { drafts = false } = {}) {
  const contentDir = path.join(config.root, config.dirs.content);
  const posts = walkMarkdown(path.join(contentDir, 'posts'))
    .map((e) => parseEntry(e, config, 'post'))
    .filter((p) => drafts || !p.draft)
    .sort((a, b) => b.date - a.date || a.title.localeCompare(b.title));
  const pages = walkMarkdown(path.join(contentDir, 'pages')).map((e) => parseEntry(e, config, 'page'));

  for (const list of [posts, pages]) {
    const seen = new Map();
    for (const item of list) {
      if (seen.has(item.slug)) throw new Error(`Duplicate slug "${item.slug}" in ${seen.get(item.slug)} and ${item.file}`);
      seen.set(item.slug, item.file);
    }
  }
  const reserved = new Set(['posts', 'tags', 'archive', 'page', 'search', 'assets']);
  for (const page of pages) {
    if (reserved.has(page.slug)) throw new Error(`${page.file}: page slug "${page.slug}" is reserved`);
  }

  posts.forEach((p, i) => {
    p.newer = posts[i - 1] ?? null;
    p.older = posts[i + 1] ?? null;
  });

  const tagMap = new Map();
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tagMap.has(tag.slug)) tagMap.set(tag.slug, { ...tag, posts: [] });
      tagMap.get(tag.slug).posts.push(post);
    }
  }
  const tags = [...tagMap.values()].sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name));
  return { posts, pages, tags };
}
