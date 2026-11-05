// m3blog client: theme switching, scroll-aware chrome, reading progress,
// sharing, code copy, table-of-contents tracking and search. No dependencies.
(() => {
  const root = document.documentElement;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const store = {
    get: (k) => {
      try { return localStorage.getItem(k); } catch { return null; }
    },
    set: (k, v) => {
      try {
        if (v == null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
      } catch { /* storage unavailable */ }
    },
  };

  // ---- Snackbar ----------------------------------------------------------
  const snackbar = $('.md-snackbar');
  let snackTimer;
  function snack(message) {
    if (!snackbar) return;
    snackbar.textContent = message;
    snackbar.classList.add('is-visible');
    clearTimeout(snackTimer);
    snackTimer = setTimeout(() => snackbar.classList.remove('is-visible'), 2800);
  }

  // ---- Theme: system → light → dark ------------------------------------
  const THEMES = [
    { id: null, icon: 'brightness_auto', label: 'system' },
    { id: 'light', icon: 'light_mode', label: 'light' },
    { id: 'dark', icon: 'dark_mode', label: 'dark' },
  ];
  const currentTheme = () => Math.max(0, THEMES.findIndex((t) => t.id === (store.get('m3blog-theme') || null)));
  function renderTheme() {
    const t = THEMES[currentTheme()];
    if (t.id) root.dataset.theme = t.id;
    else delete root.dataset.theme;
    for (const btn of $$('.theme-toggle')) {
      btn.querySelector('.material-symbols-rounded').textContent = t.icon;
      btn.title = `Theme: ${t.label}`;
      btn.setAttribute('aria-label', `Theme: ${t.label}. Click to change.`);
    }
  }
  for (const btn of $$('.theme-toggle')) {
    btn.addEventListener('click', () => {
      const next = THEMES[(currentTheme() + 1) % THEMES.length];
      store.set('m3blog-theme', next.id);
      renderTheme();
      snack(`Theme: ${next.label}`);
    });
  }
  renderTheme();

  // ---- Scroll-driven chrome ----------------------------------------------
  const progress = $('.wavy-progress');
  const toolbar = $('.floating-toolbar');
  const article = $('.post .prose');
  let lastY = scrollY;
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY;
    root.classList.toggle('is-scrolled', y > 4);
    if (progress && article) {
      const rect = article.getBoundingClientRect();
      const start = rect.top + y - innerHeight * 0.3;
      const end = start + article.offsetHeight - innerHeight * 0.4;
      const p = Math.min(1, Math.max(0, (y - start) / Math.max(1, end - start)));
      progress.style.setProperty('--progress', p.toFixed(4));
      progress.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    }
    if (toolbar) {
      const atEnd = innerHeight + y >= document.body.scrollHeight - 80;
      toolbar.classList.toggle('is-visible', y > 480 && (y < lastY || atEnd));
    }
    lastY = y;
  }
  addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  // ---- Actions: share / copy link / back to top --------------------------
  async function copy(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      snack(message);
    } catch {
      snack('Could not copy — your browser blocked clipboard access');
    }
  }
  document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const url = location.href.split('#')[0];
    switch (target.dataset.action) {
      case 'top':
        scrollTo({ top: 0 });
        $('#main')?.focus({ preventScroll: true });
        break;
      case 'copy-link':
        copy(url, 'Link copied');
        break;
      case 'share':
        if (navigator.share) {
          try { await navigator.share({ title: document.title, url }); } catch { /* dismissed */ }
        } else copy(url, 'Link copied — paste it anywhere to share');
        break;
    }
  });

  // ---- Code blocks --------------------------------------------------------
  for (const btn of $$('.code-copy')) {
    btn.addEventListener('click', () => {
      copy(btn.parentElement.querySelector('code').innerText, 'Code copied');
      const icon = btn.querySelector('.material-symbols-rounded');
      icon.textContent = 'check';
      setTimeout(() => { icon.textContent = 'content_copy'; }, 1600);
    });
  }

  // ---- Table of contents: highlight the section being read ----------------
  const tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const headings = tocLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
    const update = () => {
      const active = headings.filter((h) => h.getBoundingClientRect().top < 140).pop() ?? headings[0];
      for (const a of tocLinks) a.classList.toggle('is-active', a.hash === `#${encodeURIComponent(active.id)}` || a.hash === `#${active.id}`);
    };
    const io = new IntersectionObserver(update, { rootMargin: '-80px 0px -50% 0px' });
    headings.forEach((h) => io.observe(h));
    addEventListener('scroll', update, { passive: true });
    update();
  }

  // ---- Search -------------------------------------------------------------
  const results = $('.search-results');
  if (results) {
    const input = $('.search-bar__input');
    const loader = $('.search-status .loading-indicator');
    const status = $('.search-status__text');
    const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlight = (text, terms) => {
      const safe = escape(text);
      if (!terms.length) return safe;
      return safe.replace(new RegExp(`(${terms.map((t) => reEscape(escape(t))).join('|')})`, 'gi'), '<mark>$1</mark>');
    };
    let index = null;
    input.value = new URLSearchParams(location.search).get('q') ?? '';
    loader.hidden = false;
    status.textContent = 'Loading posts…';

    fetch(results.dataset.index)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((data) => {
        index = data;
        render();
      })
      .catch(() => { status.textContent = 'Search index could not be loaded.'; })
      .finally(() => { loader.hidden = true; });

    function render() {
      if (!index) return;
      const raw = input.value.trim();
      const terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
      const url = new URL(location.href);
      if (raw) url.searchParams.set('q', raw);
      else url.searchParams.delete('q');
      history.replaceState(null, '', url);
      if (!terms.length) {
        results.innerHTML = '';
        status.textContent = `${index.length} post${index.length === 1 ? '' : 's'} to search. Start typing.`;
        return;
      }
      const scored = [];
      for (const p of index) {
        const title = p.t.toLowerCase();
        const tags = p.g.join(' ').toLowerCase();
        const body = `${p.s} ${p.x}`.toLowerCase();
        let score = 0;
        for (const t of terms) {
          const s = (title.includes(t) ? 10 : 0) + (tags.includes(t) ? 6 : 0) + (body.includes(t) ? 1 : 0);
          if (!s) { score = 0; break; }
          score += s;
        }
        if (score) scored.push({ p, score });
      }
      scored.sort((a, b) => b.score - a.score || b.p.d.localeCompare(a.p.d));
      status.textContent = scored.length ? `${scored.length} result${scored.length === 1 ? '' : 's'}` : `No posts match “${raw}”.`;
      results.innerHTML = scored
        .map(({ p }) => `<li><a class="list-item" href="${escape(p.u)}">
          <div class="shape-badge shape-badge--sm m3-shape-${escape(p.sh)}" data-accent="${escape(p.a)}" aria-hidden="true"><span class="shape-badge__letter">${escape(p.t.charAt(0).toUpperCase())}</span></div>
          <span class="list-item__text"><span class="list-item__headline">${highlight(p.t, terms)}</span><span class="list-item__supporting">${escape(p.d)} · ${highlight(p.s, terms)}</span></span>
          <span class="material-symbols-rounded list-item__trailing" aria-hidden="true">chevron_right</span></a></li>`)
        .join('');
    }
    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(render, 80);
    });
    $('.search-bar').addEventListener('submit', (e) => {
      e.preventDefault();
      render();
    });
    if (!input.value) input.focus();
  }
})();
