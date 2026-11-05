import { Marked } from 'marked';
import hljs from 'highlight.js';

export const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;|&#\d+;/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'section';

const ADMONITIONS = { NOTE: 'info', TIP: 'lightbulb', IMPORTANT: 'priority_high', WARNING: 'warning', CAUTION: 'report' };

/**
 * Render Markdown to HTML. Returns { html, headings } where headings are h2/h3
 * entries used for the table of contents.
 */
export function renderMarkdown(src, { resolveUrl = (u) => u } = {}) {
  const headings = [];
  const used = new Map();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        let id = slugify(text);
        const n = used.get(id) ?? 0;
        used.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        if (depth === 2 || depth === 3) headings.push({ id, depth, text: text.replace(/<[^>]*>/g, '') });
        return `<h${depth} id="${id}"><a class="heading-anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${text}</h${depth}>\n`;
      },
      code({ text, lang }) {
        const language = (lang || '').trim().split(/\s+/)[0];
        const html = language && hljs.getLanguage(language) ? hljs.highlight(text, { language }).value : escapeHtml(text);
        const label = language ? `<span class="code-lang">${escapeHtml(language)}</span>` : '';
        return `<figure class="code-block">${label}<button class="md-icon-button code-copy" type="button" aria-label="Copy code"><span class="material-symbols-rounded" aria-hidden="true">content_copy</span></button><pre><code class="hljs${language ? ` language-${escapeHtml(language)}` : ''}">${html}</code></pre></figure>\n`;
      },
      image({ href, title, text }) {
        const t = title ? ` title="${escapeHtml(title)}"` : '';
        const img = `<img src="${escapeHtml(resolveUrl(href))}" alt="${escapeHtml(text)}"${t} loading="lazy" decoding="async">`;
        return title ? `<figure class="md-figure">${img}<figcaption>${escapeHtml(title)}</figcaption></figure>` : img;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        const t = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(resolveUrl(href))}"${t}${external ? ' rel="noopener"' : ''}>${text}</a>`;
      },
      blockquote({ tokens }) {
        const first = tokens[0];
        const m = first?.type === 'paragraph' && /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/.exec(first.raw);
        if (m) {
          first.tokens = marked.Lexer.lexInline(first.raw.slice(m[0].length));
          const kind = m[1].toLowerCase();
          return `<aside class="callout callout-${kind}"><span class="material-symbols-rounded callout-icon" aria-hidden="true">${ADMONITIONS[m[1]]}</span><div><p class="callout-title">${m[1][0]}${kind.slice(1)}</p>${this.parser.parse(tokens)}</div></aside>\n`;
        }
        return `<blockquote>${this.parser.parse(tokens)}</blockquote>\n`;
      },
      table(token) {
        return `<div class="table-wrap">${marked.Renderer.prototype.table.call(this, token)}</div>`;
      },
    },
  });
  const html = marked.parse(src);
  return { html, headings };
}

/** Plain-text version of markdown (for excerpts, search and reading time). */
export function stripMarkdown(src) {
  return src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/g, '')
    .replace(/[*_~`|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
