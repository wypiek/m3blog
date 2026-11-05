import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from '../src/build.js';
import { renderMarkdown, slugify } from '../src/markdown.js';
import { resolveFile } from '../src/server.js';

let dir;
const read = (rel) => fs.readFileSync(path.join(dir, 'dist', rel), 'utf8');
const post = (name, body) => fs.writeFileSync(path.join(dir, 'content/posts', name), body);

before(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'm3blog-'));
  fs.mkdirSync(path.join(dir, 'content/posts/bundle'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'content/pages'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'static/images'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'static/images/a.txt'), 'static');
  fs.writeFileSync(
    path.join(dir, 'm3blog.config.json'),
    JSON.stringify({ title: 'Test <Blog>', url: 'https://blog.test/', basePath: 'sub', postsPerPage: 2, theme: { googleFonts: false } })
  );
  post('2026-01-01-first.md', '---\ntitle: First & foremost\ntags: [Design, Motion]\n---\nHello **world**.\n\n## One\n\n## Two\n\n## Three\n\n![pic](/images/a.png)\n');
  post('2026-02-01-second.md', '---\ntitle: Second\ntags: [design]\nsummary: Custom summary\n---\nBody\n');
  post('2026-03-01-third.md', '---\ntitle: "<script>alert(1)</script>"\n---\nBody\n');
  post('2026-04-01-fourth.md', '---\ntitle: Fourth\n---\nBody\n');
  post('2026-05-01-secret.md', '---\ntitle: Secret\ndraft: true\n---\nDraft\n');
  fs.writeFileSync(path.join(dir, 'content/posts/bundle/index.md'), '---\ntitle: Bundle\ndate: 2025-06-01\n---\n![x](photo.txt)\n');
  fs.writeFileSync(path.join(dir, 'content/posts/bundle/photo.txt'), 'photo');
  fs.writeFileSync(path.join(dir, 'content/pages/about.md'), '---\ntitle: About\n---\nAbout me\n');
});
after(() => fs.rmSync(dir, { recursive: true, force: true }));

test('builds every page type', () => {
  const res = build({ root: dir });
  assert.equal(res.posts, 5);
  for (const f of ['index.html', 'page/2/index.html', 'posts/first/index.html', 'posts/bundle/photo.txt', 'about/index.html', 'archive/index.html', 'tags/index.html', 'tags/design/index.html', 'search/index.html', '404.html', 'feed.xml', 'sitemap.xml', 'search.json', 'favicon.svg', 'images/a.txt', 'assets/m3blog.css', 'assets/m3blog.js']) {
    assert.ok(fs.existsSync(path.join(dir, 'dist', f)), f);
  }
});

test('drafts are excluded from builds unless requested', () => {
  build({ root: dir });
  assert.ok(!fs.existsSync(path.join(dir, 'dist/posts/secret')));
  build({ root: dir, drafts: true });
  assert.ok(fs.existsSync(path.join(dir, 'dist/posts/secret/index.html')));
});

test('escapes user content and applies basePath', () => {
  build({ root: dir });
  const html = read('posts/third/index.html');
  assert.ok(!html.includes('<script>alert(1)'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(read('index.html').includes('Test &lt;Blog&gt;'));
  const first = read('posts/first/index.html');
  assert.ok(first.includes('href="/sub/assets/m3blog.css'));
  assert.ok(first.includes('src="/sub/images/a.png"'));
  assert.ok(first.includes('class="toc"'));
  assert.ok(first.includes('rel="canonical" href="https://blog.test/sub/posts/first/"'));
});

test('tags are merged case-insensitively by slug', () => {
  build({ root: dir });
  const tag = read('tags/design/index.html');
  assert.ok(tag.includes('First &amp; foremost') && tag.includes('Second'));
});

test('feed, sitemap and search index are valid', () => {
  build({ root: dir });
  const feed = read('feed.xml');
  assert.ok(feed.startsWith('<?xml'));
  assert.ok(feed.includes('<link>https://blog.test/sub/posts/fourth/</link>'));
  assert.ok(read('sitemap.xml').includes('https://blog.test/sub/tags/motion/'));
  const index = JSON.parse(read('search.json'));
  assert.equal(index[0].t, 'Fourth');
  assert.equal(index.find((p) => p.t === 'Second').s, 'Custom summary');
});

test('bad front matter gives a helpful error', () => {
  post('2026-06-01-bad.md', '---\ntitle: Bad\nshape: triangle-ish\n---\n');
  assert.throws(() => build({ root: dir }), /unknown shape "triangle-ish"/);
  fs.rmSync(path.join(dir, 'content/posts/2026-06-01-bad.md'));
});

test('markdown helpers', () => {
  const { html, headings } = renderMarkdown('## Hello\n## Hello\n> [!TIP]\n> Be nice\n');
  assert.deepEqual(headings.map((h) => h.id), ['hello', 'hello-1']);
  assert.ok(html.includes('callout-tip'));
  assert.equal(slugify('Ünïcode Title!'), 'unicode-title');
});

test('dev server path resolution blocks traversal', () => {
  build({ root: dir });
  const out = path.join(dir, 'dist');
  assert.equal(resolveFile(out, '/'), path.join(out, 'index.html'));
  assert.equal(resolveFile(out, '/../m3blog.config.json'), null);
  assert.equal(resolveFile(out, '/%2e%2e/m3blog.config.json'), null);
});
