import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { loadContent } from './content.js';
import { escapeHtml as esc } from './markdown.js';
import { tokensCss } from './theme/tokens.js';
import { colorScheme } from './theme/color.js';
import * as T from './templates/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = path.join(here, 'client');

function write(outDir, rel, contents) {
  const file = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

const page = (p) => `${p.replace(/^\/+/, '')}index.html`;

function copyDir(src, dest, { skip = () => false } = {}) {
  if (!fs.existsSync(src)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || skip(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) n += copyDir(from, to, { skip });
    else {
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(from, to);
      n++;
    }
  }
  return n;
}

function rssFeed(config, h, posts) {
  const items = posts
    .slice(0, 20)
    .map(
      (p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${esc(h.absUrl(`/posts/${p.slug}/`))}</link>
    <guid isPermaLink="true">${esc(h.absUrl(`/posts/${p.slug}/`))}</guid>
    <pubDate>${p.date.toUTCString()}</pubDate>
    <description>${esc(p.summary)}</description>
${p.tags.map((t) => `    <category>${esc(t.name)}</category>`).join('\n')}
    <content:encoded><![CDATA[${p.html.replaceAll(']]>', ']]]]><![CDATA[>')}]]></content:encoded>
  </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>${esc(config.title)}</title>
  <link>${esc(h.absUrl('/'))}</link>
  <description>${esc(config.description)}</description>
  <language>${esc(config.language)}</language>
  <atom:link href="${esc(h.absUrl('/feed.xml'))}" rel="self" type="application/rss+xml"/>
${posts[0] ? `  <lastBuildDate>${(posts[0].updated ?? posts[0].date).toUTCString()}</lastBuildDate>\n` : ''}${items}
</channel>
</rss>
`;
}

function sitemap(h, entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(([p, d]) => `  <url><loc>${esc(h.absUrl(p))}</loc>${d ? `<lastmod>${d.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
}

/**
 * Build the site. Returns a summary `{ outDir, posts, pages, tags, files, ms }`.
 */
export function build({ root = process.cwd(), drafts = false, devScript = '', overrides = {} } = {}) {
  const started = performance.now();
  const config = loadConfig(root, overrides);
  const { posts, pages, tags } = loadContent(config, { drafts });
  const outDir = path.resolve(root, config.dirs.output);
  if (outDir === path.resolve(root) || !outDir.startsWith(path.resolve(root))) throw new Error(`Refusing to use "${config.dirs.output}" as output directory`);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const h = T.createHelpers(config);
  const colors = {
    light: colorScheme(config.theme.seedColor, { variant: config.theme.variant, contrast: config.theme.contrast }),
    dark: colorScheme(config.theme.seedColor, { dark: true, variant: config.theme.variant, contrast: config.theme.contrast }),
  };
  const ctx = { config, h, colors, version: Date.now().toString(36), logo: T.logoSvg(config.theme.logoShape ?? 'cookie9'), devScript };
  let files = 0;
  const out = (rel, html) => {
    write(outDir, rel, html);
    files++;
  };

  // Static files first so generated pages win on conflicts.
  files += copyDir(path.join(root, config.dirs.static), outDir);

  // Assets
  out('assets/m3blog.css', `${tokensCss(config.theme)}\n${fs.readFileSync(path.join(CLIENT_DIR, 'm3blog.css'), 'utf8')}`);
  out('assets/m3blog.js', fs.readFileSync(path.join(CLIENT_DIR, 'm3blog.js'), 'utf8'));
  if (!fs.existsSync(path.join(outDir, 'favicon.svg'))) out('favicon.svg', T.faviconSvg(colors, config.theme.logoShape ?? 'cookie9'));

  // Home + pagination
  const per = config.postsPerPage;
  const firstPageCount = per + 1; // featured card + grid
  const totalPages = Math.max(1, 1 + Math.ceil(Math.max(0, posts.length - firstPageCount) / per));
  for (let n = 1; n <= totalPages; n++) {
    const slice = n === 1 ? posts.slice(0, firstPageCount) : posts.slice(firstPageCount + (n - 2) * per, firstPageCount + (n - 1) * per);
    out(n === 1 ? 'index.html' : page(`/page/${n}/`), T.homePage(ctx, { posts: slice, page: n, totalPages }));
  }

  // Posts (+ bundled assets next to index.md)
  for (const post of posts) {
    out(page(`/posts/${post.slug}/`), T.postPage(ctx, post));
    if (post.bundleDir) files += copyDir(post.bundleDir, path.join(outDir, 'posts', post.slug), { skip: (n) => n.endsWith('.md') });
  }
  for (const p of pages) {
    out(page(`/${p.slug}/`), T.staticPage(ctx, p));
    if (p.bundleDir) files += copyDir(p.bundleDir, path.join(outDir, p.slug), { skip: (n) => n.endsWith('.md') });
  }

  out(page('/archive/'), T.archivePage(ctx, posts));
  out(page('/tags/'), T.tagsPage(ctx, tags));
  for (const tag of tags) out(page(`/tags/${tag.slug}/`), T.tagPage(ctx, tag));
  out(page('/search/'), T.searchPage(ctx));
  out('404.html', T.notFoundPage(ctx));

  out(
    'search.json',
    JSON.stringify(
      posts.map((p) => ({ t: p.title, u: h.postUrl(p), d: p.date.toISOString().slice(0, 10), s: p.summary, g: p.tags.map((t) => t.name), x: p.plain.slice(0, 8000), sh: p.shape, a: p.accent }))
    )
  );
  out('feed.xml', rssFeed(config, h, posts));
  out(
    'sitemap.xml',
    sitemap(h, [
      ['/', posts[0]?.date],
      ...posts.map((p) => [`/posts/${p.slug}/`, p.updated ?? p.date]),
      ...pages.map((p) => [`/${p.slug}/`]),
      ['/archive/'],
      ['/tags/'],
      ...tags.map((t) => [`/tags/${t.slug}/`]),
    ])
  );
  if (!fs.existsSync(path.join(outDir, 'robots.txt'))) out('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${h.absUrl('/sitemap.xml')}\n`);
  out('.nojekyll', '');

  return { outDir, posts: posts.length, pages: pages.length, tags: tags.length, files, ms: Math.round(performance.now() - started) };
}
