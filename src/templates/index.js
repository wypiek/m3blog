// Page templates. Plain template literals: no template language to learn.
import { escapeHtml as esc } from '../markdown.js';
import { shapePath } from '../theme/shapes.js';

const icon = (name, extra = '') => `<span class="material-symbols-rounded${extra ? ` ${extra}` : ''}" aria-hidden="true">${esc(name)}</span>`;

// Shapes a badge morphs into on hover (paired with its resting shape).
const HOVER_SHAPE = {
  cookie9: 'flower', cookie7: 'sunny', clover4: 'cookie4', clover8: 'puffy', sunny: 'cookie12', verySunny: 'softBurst',
  softBurst: 'cookie9', flower: 'clover8', puffy: 'cookie7', pentagon: 'gem', gem: 'cookie6', arch: 'square',
  cookie12: 'verySunny', pill: 'oval', oval: 'pill', burst: 'boom',
};

export function createHelpers(config) {
  const url = (p = '/') => (/^[a-z]+:|^\/\/|^#/i.test(p) ? p : config.basePath + String(p).replace(/^\/+/, ''));
  const absUrl = (p) => (/^[a-z]+:/i.test(p) ? p : config.url + url(p));
  const fmt = new Intl.DateTimeFormat(config.language, { ...config.dateFormat, timeZone: 'UTC' });
  const date = (d) => `<time datetime="${d.toISOString().slice(0, 10)}">${esc(fmt.format(d))}</time>`;
  return { url, absUrl, date, postUrl: (p) => url(`/posts/${p.slug}/`), tagUrl: (t) => url(`/tags/${t.slug}/`) };
}

function shapeBadge(item, { size = '', label } = {}) {
  const hover = HOVER_SHAPE[item.shape] ?? 'circle';
  const content = item.icon ? icon(item.icon) : `<span class="shape-badge__letter">${esc((label ?? item.title).trim().charAt(0).toUpperCase())}</span>`;
  return `<div class="shape-badge ${size} m3-shape-${item.shape}" data-accent="${esc(item.accent)}" style="--m3-shape-hover: var(--m3-shape-${hover})" aria-hidden="true">${content}</div>`;
}

const tagChips = (tags, h, cls = '') =>
  tags.length
    ? `<ul class="chip-set ${cls}" aria-label="Tags">${tags.map((t) => `<li><a class="md-chip" href="${h.tagUrl(t)}">${icon('tag', 'md-chip__icon')}${esc(t.name)}</a></li>`).join('')}</ul>`
    : '';

const meta = (post, h) => `${h.date(post.date)}<span class="dot" aria-hidden="true">·</span><span>${post.minutes} min read</span>`;

function navItems(config, h, current, cls) {
  return config.nav
    .map((item) => {
      const href = h.url(item.href);
      const active = item.href === '/' ? current === '/' || current.startsWith('/page/') : current.startsWith(item.href);
      return `<a class="${cls}" href="${esc(href)}"${active ? ' aria-current="page"' : ''}><span class="${cls}__indicator">${icon(item.icon ?? 'circle')}</span><span class="${cls}__label">${esc(item.label)}</span></a>`;
    })
    .join('');
}

const themeButton = (cls = '') =>
  `<button class="md-icon-button theme-toggle ${cls}" type="button" aria-label="Change theme" title="Theme: system">${icon('brightness_auto')}</button>`;

export function layout(ctx, { title, description, body, path: current = '/', type = 'page', head = '', progress = false, image = null }) {
  const { config, h } = ctx;
  const fullTitle = title ? `${title} · ${config.title}` : config.title;
  const desc = description ?? config.description;
  const fonts = config.theme.googleFonts
    ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${[...new Set([config.theme.fontBrand, config.theme.fontPlain])]
        .map((f) => `${encodeURIComponent(f).replace(/%20/g, '+')}:opsz,wdth,wght@8..144,25..151,100..1000`)
        .join('&family=')}&family=Roboto+Mono:wght@400;500&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap">`
    : '';
  return `<!doctype html>
<html lang="${esc(config.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(h.absUrl(current))}">
<meta property="og:title" content="${esc(title ?? config.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${type === 'post' ? 'article' : 'website'}">
<meta property="og:url" content="${esc(h.absUrl(current))}">
<meta property="og:site_name" content="${esc(config.title)}">
${image ? `<meta property="og:image" content="${esc(h.absUrl(image))}"><meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<meta name="theme-color" content="${ctx.colors.light.surface}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${ctx.colors.dark.surface}" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${h.url('/favicon.svg')}" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(config.title)}" href="${h.url('/feed.xml')}">
<script>try{var t=localStorage.getItem('m3blog-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
${fonts}
<link rel="stylesheet" href="${h.url(`/assets/m3blog.css?v=${ctx.version}`)}">
${head}
</head>
<body class="type-${esc(type)}" data-base="${esc(config.basePath)}">
<a class="skip-link" href="#main">Skip to content</a>
${progress ? `<div class="wavy-progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="wavy-progress__active"></div><div class="wavy-progress__track"></div></div>` : ''}
<nav class="nav-rail" aria-label="Main">
  <a class="nav-rail__brand" href="${h.url('/')}" aria-label="${esc(config.title)} home">${ctx.logo}</a>
  <a class="md-fab md-fab--tonal nav-rail__fab" href="${h.url('/search/')}" aria-label="Search">${icon('search')}</a>
  <div class="nav-rail__items">${navItems(config, h, current, 'nav-rail-item')}</div>
  <div class="nav-rail__footer">${themeButton()}</div>
</nav>
<div class="app">
  <header class="top-app-bar">
    <a class="top-app-bar__brand" href="${h.url('/')}">${ctx.logo}<span class="top-app-bar__title">${esc(config.title)}</span></a>
    <div class="top-app-bar__actions">
      <a class="md-icon-button" href="${h.url('/search/')}" aria-label="Search">${icon('search')}</a>
      ${themeButton('top-app-bar__theme')}
    </div>
  </header>
  <main id="main" tabindex="-1">
${body}
  </main>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="md-typescale-body-medium">© ${new Date().getUTCFullYear()} ${esc(config.author.name)} · Built with <a href="https://github.com/wypiek/m3blog">m3blog</a> and Material 3 Expressive</p>
      <div class="site-footer__links">
        ${config.social.map((s) => `<a class="md-icon-button" href="${esc(s.href)}" rel="me noopener" aria-label="${esc(s.label)}" title="${esc(s.label)}">${icon(s.icon ?? 'link')}</a>`).join('')}
        <a class="md-icon-button" href="${h.url('/feed.xml')}" aria-label="RSS feed" title="RSS feed">${icon('rss_feed')}</a>
      </div>
    </div>
  </footer>
</div>
<nav class="nav-bar" aria-label="Main">${navItems(config, h, current, 'nav-bar-item')}</nav>
<div class="md-snackbar" role="status" aria-live="polite"></div>
<script src="${h.url(`/assets/m3blog.js?v=${ctx.version}`)}" defer></script>
${ctx.devScript ?? ''}
</body>
</html>
`;
}

export function postCard(post, h, { featured = false } = {}) {
  const media = post.cover
    ? `<div class="post-card__cover"><img src="${esc(post.cover)}" alt="${esc(post.coverAlt)}" loading="lazy" decoding="async"></div>`
    : shapeBadge(post, { size: featured ? 'shape-badge--xl' : '' });
  return `<article class="post-card${featured ? ' post-card--featured' : ''}" data-accent="${esc(post.accent)}">
  <div class="post-card__media">${media}</div>
  <div class="post-card__body">
    <p class="post-card__meta">${meta(post, h)}</p>
    <h${featured ? 2 : 3} class="post-card__title"><a class="post-card__link" href="${h.postUrl(post)}">${esc(post.title)}</a></h${featured ? 2 : 3}>
    <p class="post-card__excerpt">${esc(post.summary)}</p>
    ${tagChips(post.tags.slice(0, 2), h)}
  </div>
</article>`;
}

function pagination(page, totalPages, h, base) {
  if (totalPages <= 1) return '';
  const href = (n) => h.url(n === 1 ? base : `${base}page/${n}/`);
  const nums = [];
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= 1) nums.push(n);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const btn = (n, label, aria, disabled) =>
    disabled
      ? `<span class="md-button md-button--tonal is-disabled" aria-disabled="true">${label}</span>`
      : `<a class="md-button md-button--tonal" href="${href(n)}" aria-label="${aria}">${label}</a>`;
  return `<nav class="pagination" aria-label="Pagination">
  <div class="button-group button-group--connected">
    ${btn(page - 1, `${icon('arrow_back')}<span class="pagination__text">Newer</span>`, 'Newer posts', page === 1)}
    ${nums
      .map((n) =>
        n === '…'
          ? `<span class="md-button md-button--tonal is-disabled" aria-hidden="true">…</span>`
          : n === page
            ? `<span class="md-button md-button--filled is-selected" aria-current="page">${n}</span>`
            : `<a class="md-button md-button--tonal" href="${href(n)}" aria-label="Page ${n}">${n}</a>`
      )
      .join('')}
    ${btn(page + 1, `<span class="pagination__text">Older</span>${icon('arrow_forward')}`, 'Older posts', page === totalPages)}
  </div>
</nav>`;
}

export function homePage(ctx, { posts, page, totalPages }) {
  const { config, h } = ctx;
  const [first, ...rest] = posts;
  const hero =
    page === 1
      ? `<section class="hero">
  <div class="hero__text">
    <h1 class="hero__title">${esc(config.title)}</h1>
    <p class="hero__description">${esc(config.description)}</p>
    <div class="hero__actions">
      <a class="md-button md-button--filled" href="${h.url('/archive/')}">${icon('auto_stories')}Browse posts</a>
      <a class="md-button md-button--text" href="${h.url('/feed.xml')}">${icon('rss_feed')}Subscribe</a>
    </div>
  </div>
  <div class="hero__shapes" aria-hidden="true">
    <span class="hero-shape hero-shape--1"></span><span class="hero-shape hero-shape--2"></span><span class="hero-shape hero-shape--3"></span>
    ${config.author.avatar ? `<img class="hero__avatar" src="${esc(h.url(config.author.avatar))}" alt="">` : ''}
  </div>
</section>`
      : `<header class="page-header"><p class="page-header__eyebrow">Page ${page} of ${totalPages}</p><h1 class="page-header__title">Older posts</h1></header>`;
  const body = posts.length
    ? `${page === 1 && first ? `<section class="featured" aria-label="Latest post">${postCard(first, h, { featured: true })}</section>` : ''}
<section class="post-grid" aria-label="Posts">
${(page === 1 ? rest : posts).map((p) => postCard(p, h)).join('\n')}
</section>
${pagination(page, totalPages, h, '/')}`
    : `<div class="empty-state">${shapeBadge({ shape: 'cookie9', accent: 'tertiary', icon: 'edit_note', title: '' }, { size: 'shape-badge--xl' })}<h2>No posts yet</h2><p>Run <code>npm run new "My first post"</code> to write one.</p></div>`;
  return layout(ctx, { title: page === 1 ? null : `Page ${page}`, body: `${hero}\n${body}`, path: page === 1 ? '/' : `/page/${page}/`, type: 'home' });
}

function toc(headings) {
  return `<nav class="toc" aria-label="On this page">
  <p class="toc__title">On this page</p>
  <ol class="toc__list">${headings.map((x) => `<li class="toc__item toc__item--h${x.depth}"><a href="#${esc(x.id)}">${esc(x.text)}</a></li>`).join('')}</ol>
</nav>`;
}

export function postPage(ctx, post) {
  const { config, h } = ctx;
  const avatar = config.author.avatar
    ? `<img class="author-chip__avatar" src="${esc(h.url(config.author.avatar))}" alt="">`
    : `<span class="author-chip__avatar author-chip__avatar--letter">${esc(config.author.name.charAt(0))}</span>`;
  const media = post.cover
    ? `<figure class="post-hero__cover"><img src="${esc(post.cover)}" alt="${esc(post.coverAlt)}" decoding="async"></figure>`
    : `<div class="post-hero__badge">${shapeBadge(post, { size: 'shape-badge--hero' })}</div>`;
  const neighbour = (p, dir) =>
    p
      ? `<a class="post-nav__link post-nav__link--${dir}" href="${h.postUrl(p)}"><span class="post-nav__label">${icon(dir === 'newer' ? 'arrow_back' : 'arrow_forward')}${dir === 'newer' ? 'Newer' : 'Older'}</span><span class="post-nav__title">${esc(p.title)}</span></a>`
      : '<span></span>';
  const body = `<article class="post" data-accent="${esc(post.accent)}">
  <header class="post-hero${post.cover ? ' post-hero--cover' : ''}">
    <div class="post-hero__text">
      ${tagChips(post.tags, h)}
      <h1 class="post-hero__title">${esc(post.title)}</h1>
      <div class="post-hero__meta">
        <span class="author-chip">${avatar}<span>${esc(config.author.name)}</span></span>
        <span class="post-hero__facts">${meta(post, h)}${post.updated ? `<span class="dot" aria-hidden="true">·</span><span>Updated ${h.date(post.updated)}</span>` : ''}</span>
      </div>
    </div>
    ${media}
  </header>
  <div class="post-layout${post.toc && post.headings.length ? ' post-layout--toc' : ''}">
    ${post.toc && post.headings.length ? toc(post.headings) : ''}
    <div class="prose">
${post.html}
    </div>
  </div>
  <footer class="post-footer">
    <div class="share-row">
      <p class="share-row__label">Enjoyed this post? Share it.</p>
      <div class="button-group button-group--standard">
        <button class="md-button md-button--tonal" type="button" data-action="share">${icon('share')}Share</button>
        <button class="md-button md-button--tonal" type="button" data-action="copy-link">${icon('link')}Copy link</button>
      </div>
    </div>
    ${config.author.bio ? `<section class="author-card">${avatar}<div><p class="author-card__name">${esc(config.author.name)}</p><p class="author-card__bio">${esc(config.author.bio)}</p></div></section>` : ''}
    <nav class="post-nav" aria-label="More posts">${neighbour(post.newer, 'newer')}${neighbour(post.older, 'older')}</nav>
  </footer>
</article>
<div class="floating-toolbar" role="toolbar" aria-label="Post actions">
  <button class="md-icon-button" type="button" data-action="top" aria-label="Back to top" title="Back to top">${icon('vertical_align_top')}</button>
  <button class="md-icon-button" type="button" data-action="copy-link" aria-label="Copy link" title="Copy link">${icon('link')}</button>
  <button class="md-icon-button md-icon-button--filled" type="button" data-action="share" aria-label="Share" title="Share">${icon('share')}</button>
</div>`;
  const head = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date.toISOString(),
    dateModified: (post.updated ?? post.date).toISOString(),
    author: { '@type': 'Person', name: config.author.name },
    description: post.summary,
    mainEntityOfPage: h.absUrl(`/posts/${post.slug}/`),
  }).replace(/</g, '\\u003c')}</script>
<meta property="article:published_time" content="${post.date.toISOString()}">`;
  return layout(ctx, { title: post.title, description: post.summary, body, path: `/posts/${post.slug}/`, type: 'post', head, progress: true, image: post.cover });
}

export function staticPage(ctx, page) {
  const body = `<article class="post page">
  <header class="page-header">
    ${shapeBadge(page, { size: 'shape-badge--lg' })}
    <h1 class="page-header__title">${esc(page.title)}</h1>
  </header>
  <div class="post-layout"><div class="prose">
${page.html}
  </div></div>
</article>`;
  return layout(ctx, { title: page.title, description: page.summary, body, path: `/${page.slug}/`, type: 'page' });
}

export function archivePage(ctx, posts) {
  const { h } = ctx;
  const years = new Map();
  for (const p of posts) {
    const y = p.date.getUTCFullYear();
    if (!years.has(y)) years.set(y, []);
    years.get(y).push(p);
  }
  const body = `<header class="page-header">
  <p class="page-header__eyebrow">${posts.length} post${posts.length === 1 ? '' : 's'}</p>
  <h1 class="page-header__title">Archive</h1>
</header>
${[...years]
  .map(
    ([year, list]) => `<section class="archive-year">
  <h2 class="archive-year__title">${year}<span class="archive-year__count">${list.length}</span></h2>
  <ul class="segmented-list">
    ${list
      .map(
        (p) => `<li><a class="list-item" href="${h.postUrl(p)}">
      ${shapeBadge(p, { size: 'shape-badge--sm' })}
      <span class="list-item__text"><span class="list-item__headline">${esc(p.title)}</span><span class="list-item__supporting">${h.date(p.date)} · ${p.minutes} min read${p.tags.length ? ` · ${p.tags.map((t) => esc(t.name)).join(', ')}` : ''}</span></span>
      ${icon('chevron_right', 'list-item__trailing')}
    </a></li>`
      )
      .join('\n    ')}
  </ul>
</section>`
  )
  .join('\n')}`;
  return layout(ctx, { title: 'Archive', body, path: '/archive/', type: 'archive' });
}

export function tagsPage(ctx, tags) {
  const { h } = ctx;
  const body = `<header class="page-header">
  <p class="page-header__eyebrow">${tags.length} tag${tags.length === 1 ? '' : 's'}</p>
  <h1 class="page-header__title">Tags</h1>
</header>
<ul class="tag-cloud">
${tags.map((t) => `<li><a class="md-chip md-chip--large" href="${h.tagUrl(t)}">${icon('tag', 'md-chip__icon')}${esc(t.name)}<span class="md-badge">${t.posts.length}</span></a></li>`).join('\n')}
</ul>`;
  return layout(ctx, { title: 'Tags', body, path: '/tags/', type: 'tags' });
}

export function tagPage(ctx, tag) {
  const { h } = ctx;
  const body = `<header class="page-header">
  <p class="page-header__eyebrow"><a href="${h.url('/tags/')}">Tags</a> / ${tag.posts.length} post${tag.posts.length === 1 ? '' : 's'}</p>
  <h1 class="page-header__title">#${esc(tag.name)}</h1>
</header>
<section class="post-grid" aria-label="Posts tagged ${esc(tag.name)}">
${tag.posts.map((p) => postCard(p, h)).join('\n')}
</section>`;
  return layout(ctx, { title: `#${tag.name}`, description: `Posts tagged ${tag.name}`, body, path: `/tags/${tag.slug}/`, type: 'tag' });
}

export function searchPage(ctx) {
  const { h } = ctx;
  const body = `<header class="page-header"><h1 class="page-header__title">Search</h1></header>
<form class="search-bar" role="search" action="${h.url('/search/')}">
  ${icon('search', 'search-bar__icon')}
  <input class="search-bar__input" type="search" name="q" placeholder="Search posts" aria-label="Search posts" autocomplete="off">
</form>
<div class="search-status" aria-live="polite">
  <div class="loading-indicator" hidden><span class="loading-indicator__shape"></span></div>
  <p class="search-status__text"></p>
</div>
<ul class="segmented-list search-results" data-index="${h.url('/search.json')}"></ul>
<noscript><p>Search needs JavaScript. Try the <a href="${h.url('/archive/')}">archive</a> instead.</p></noscript>`;
  return layout(ctx, { title: 'Search', body, path: '/search/', type: 'search' });
}

export function notFoundPage(ctx) {
  const { h } = ctx;
  const body = `<section class="not-found">
  <div class="loading-indicator loading-indicator--xl" aria-hidden="true"><span class="loading-indicator__shape"></span></div>
  <h1 class="not-found__title">404</h1>
  <p class="not-found__text">This page wandered off. It may have been moved or never existed.</p>
  <div class="button-group button-group--standard">
    <a class="md-button md-button--filled" href="${h.url('/')}">${icon('home')}Go home</a>
    <a class="md-button md-button--tonal" href="${h.url('/search/')}">${icon('search')}Search</a>
  </div>
</section>`;
  return layout(ctx, { title: 'Not found', body, path: '/404.html', type: 'not-found' });
}

export function logoSvg(shape = 'cookie9') {
  return `<svg class="brand-shape" viewBox="0 0 100 100" aria-hidden="true"><path d="${shapePath(shape)}"/></svg>`;
}

export function faviconSvg(colors, shape = 'cookie9') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>path{fill:${colors.light.primary}}@media (prefers-color-scheme:dark){path{fill:${colors.dark.primary}}}</style><path d="${shapePath(shape)}"/></svg>`;
}
