import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.js';
import { loadConfig, CONFIG_FILE } from './config.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

const RELOAD_PATH = '/__m3blog/reload';
const DEV_SCRIPT = `<script>(()=>{const es=new EventSource('${RELOAD_PATH}');es.onmessage=e=>{if(e.data==='reload')location.reload()}})()</script>`;

/** Resolve a request path to a file inside `outDir`, or null. */
export function resolveFile(outDir, urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  const file = path.join(outDir, path.normalize(rel));
  if (!file.startsWith(outDir)) return null;
  try {
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      const index = path.join(file, 'index.html');
      return fs.existsSync(index) ? index : null;
    }
    return file;
  } catch {
    return null;
  }
}

export function serve({ root = process.cwd(), port = 4000, host = 'localhost', drafts = true } = {}) {
  const clients = new Set();
  const engineDir = path.dirname(fileURLToPath(import.meta.url));
  let outDir;

  const rebuild = (reason) => {
    try {
      const res = build({ root, drafts, devScript: DEV_SCRIPT, overrides: { url: `http://${host}:${port}`, basePath: '/' } });
      outDir = res.outDir;
      console.log(`${reason ? `↻ ${reason} — ` : ''}built ${res.posts} posts, ${res.pages} pages, ${res.tags} tags in ${res.ms}ms`);
      for (const res of clients) res.write('data: reload\n\n');
    } catch (err) {
      console.error(`✖ Build failed: ${err.message}`);
    }
  };
  rebuild();
  if (!outDir) outDir = path.resolve(root, loadConfig(root).dirs.output);

  const server = http.createServer((req, res) => {
    if (req.url === RELOAD_PATH) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    const pathname = new URL(req.url, 'http://x').pathname;
    let file = resolveFile(outDir, pathname);
    if (file && fs.statSync(file).isFile() && !pathname.endsWith('/') && file.endsWith('index.html') && !pathname.endsWith('.html')) {
      res.writeHead(301, { Location: `${pathname}/` });
      return res.end();
    }
    let status = 200;
    if (!file) {
      status = 404;
      file = path.join(outDir, '404.html');
      if (!fs.existsSync(file)) {
        res.writeHead(404).end('Not found');
        return;
      }
    }
    res.writeHead(status, { 'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });

  const config = loadConfig(root);
  const watched = [path.join(root, config.dirs.content), path.join(root, config.dirs.static), path.join(root, CONFIG_FILE), engineDir];
  let timer;
  for (const target of watched) {
    if (!fs.existsSync(target)) continue;
    fs.watch(target, { recursive: fs.statSync(target).isDirectory() }, (_event, name) => {
      // Engine modules are cached by Node; only client assets reload live.
      if (target === engineDir && name && !String(name).startsWith('client')) {
        console.log(`! ${name} changed — restart "m3blog dev" to pick up engine changes`);
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => rebuild(name ? path.basename(String(name)) : 'change'), 80);
    });
  }

  server.listen(port, host, () => {
    console.log(`\n  m3blog dev server running at http://${host}:${port}/  (drafts ${drafts ? 'visible' : 'hidden'})\n`);
  });
  return server;
}
