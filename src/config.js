import fs from 'node:fs';
import path from 'node:path';

export const CONFIG_FILE = 'm3blog.config.json';

export const DEFAULTS = {
  title: 'My m3blog',
  description: 'A blog built with m3blog and Material 3 Expressive.',
  url: 'http://localhost:4000', // public origin, used for feeds, sitemap and canonical links
  basePath: '/', // set to "/repo-name/" when hosting under a sub-path (e.g. GitHub Pages)
  language: 'en',
  author: { name: 'Anonymous', bio: '', avatar: '', url: '' },
  postsPerPage: 9,
  dateFormat: { year: 'numeric', month: 'long', day: 'numeric' },
  theme: {
    seedColor: '#6750A4',
    variant: 'tonalSpot', // tonalSpot | vibrant | expressive | content | fidelity | neutral | monochrome | rainbow | fruitSalad
    contrast: 0, // -1 … 1
    motion: 'expressive', // expressive | standard
    fontBrand: 'Roboto Flex',
    fontPlain: 'Roboto Flex',
    googleFonts: true, // load fonts + Material Symbols from Google Fonts
  },
  nav: [
    { label: 'Home', href: '/', icon: 'home' },
    { label: 'Archive', href: '/archive/', icon: 'inventory_2' },
    { label: 'Tags', href: '/tags/', icon: 'sell' },
    { label: 'About', href: '/about/', icon: 'person' },
  ],
  social: [], // [{ label: 'GitHub', href: 'https://github.com/you', icon: 'code' }]
  dirs: { content: 'content', static: 'static', output: 'dist' },
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function merge(base, extra) {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra ?? {})) out[k] = isObj(v) && isObj(base[k]) ? merge(base[k], v) : v;
  return out;
}

export function loadConfig(root = process.cwd(), overrides = {}) {
  const file = path.join(root, CONFIG_FILE);
  let user = {};
  if (fs.existsSync(file)) {
    try {
      user = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      throw new Error(`Could not parse ${CONFIG_FILE}: ${err.message}`);
    }
  }
  const config = merge(merge(DEFAULTS, user), overrides);
  config.root = root;
  config.basePath = `/${String(config.basePath).replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
  config.url = String(config.url).replace(/\/+$/, '');
  if (!Number.isInteger(config.postsPerPage) || config.postsPerPage < 1) throw new Error('postsPerPage must be a positive integer');
  return config;
}
