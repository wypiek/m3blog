#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { build } from '../src/build.js';
import { serve } from '../src/server.js';
import { loadConfig, CONFIG_FILE } from '../src/config.js';
import { slugify } from '../src/markdown.js';

const HELP = `m3blog — a blog engine styled with Material 3 Expressive

Usage
  m3blog init [dir]          Create a new blog (config, sample posts, static folder)
  m3blog dev                 Start the dev server with live reload (drafts visible)
  m3blog build               Build the site into ./dist
  m3blog new "Post title"    Create a new post (use --page for a page)

Options
  --port <n>     Dev server port (default 4000)
  --host <h>     Dev server host (default localhost)
  --drafts       Include drafts in "build"
  --no-drafts    Hide drafts in "dev"
  --page         With "new": create a page instead of a post
  -h, --help     Show this help
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    port: { type: 'string', default: '4000' },
    host: { type: 'string', default: 'localhost' },
    drafts: { type: 'boolean', default: false },
    'no-drafts': { type: 'boolean', default: false },
    page: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const [command, ...rest] = positionals;
const root = process.cwd();

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

try {
  switch (values.help ? 'help' : command) {
    case 'build': {
      const res = build({ root, drafts: values.drafts });
      console.log(`✔ Built ${res.posts} posts, ${res.pages} pages and ${res.tags} tags (${res.files} files) into ${path.relative(root, res.outDir) || '.'} in ${res.ms}ms`);
      break;
    }
    case 'dev':
    case 'serve': {
      const port = Number(values.port);
      if (!Number.isInteger(port) || port < 1 || port > 65535) fail(`Invalid port "${values.port}"`);
      serve({ root, port, host: values.host, drafts: !values['no-drafts'] });
      break;
    }
    case 'new': {
      const title = rest.join(' ').trim();
      if (!title) fail('Give the post a title: m3blog new "My post"');
      const config = loadConfig(root);
      const today = new Date().toISOString().slice(0, 10);
      const slug = slugify(title);
      const dir = path.join(root, config.dirs.content, values.page ? 'pages' : 'posts');
      const file = path.join(dir, values.page ? `${slug}.md` : `${today}-${slug}.md`);
      if (fs.existsSync(file)) fail(`${path.relative(root, file)} already exists`);
      fs.mkdirSync(dir, { recursive: true });
      const fm = values.page
        ? `---\ntitle: ${JSON.stringify(title)}\nicon: description\n---\n\nWrite your page here.\n`
        : `---\ntitle: ${JSON.stringify(title)}\ndate: ${today}\ntags: []\nsummary: ""\ndraft: true\n---\n\nWrite the opening paragraph here.\n\n<!-- more -->\n\n## A section\n\nKeep writing. Remove \`draft: true\` when it's ready to publish.\n`;
      fs.writeFileSync(file, fm);
      console.log(`✔ Created ${path.relative(root, file)}${values.page ? '' : ' (draft — visible in "dev", hidden in "build")'}`);
      break;
    }
    case 'init': {
      const target = path.resolve(root, rest[0] ?? '.');
      const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
      if (fs.existsSync(path.join(target, CONFIG_FILE))) fail(`${CONFIG_FILE} already exists in ${target}`);
      fs.mkdirSync(target, { recursive: true });
      fs.copyFileSync(path.join(pkgRoot, CONFIG_FILE), path.join(target, CONFIG_FILE));
      for (const dir of ['content', 'static']) fs.cpSync(path.join(pkgRoot, dir), path.join(target, dir), { recursive: true, errorOnExist: false, force: false });
      console.log(`✔ New blog created in ${target}\n\nNext steps:\n  ${rest[0] ? `cd ${rest[0]}\n  ` : ''}npx m3blog dev\n\nEdit ${CONFIG_FILE} to set your title and seed color, and write posts in content/posts/.`);
      break;
    }
    case 'help':
    case undefined:
      console.log(HELP);
      break;
    default:
      fail(`Unknown command "${command}"\n\n${HELP}`);
  }
} catch (err) {
  fail(err.message);
}
