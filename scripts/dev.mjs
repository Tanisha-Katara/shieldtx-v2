import {createServer} from 'node:http';
import {readFile, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const source = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.avif': 'image/avif',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm'
};

export function createStaticHandler(directory = source) {
  const base = path.resolve(directory);
  return async (request, response) => {
    function reply(status, message) {
      response.writeHead(status, {'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff'});
      response.end(request.method === 'HEAD' ? undefined : message);
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      reply(405, 'Method not allowed');
      return;
    }
    let pathname;
    try { pathname = decodeURIComponent((request.url || '/').split(/[?#]/, 1)[0]); }
    catch { reply(400, 'Invalid request'); return; }
    const segments = pathname.split('/');
    if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0') ||
      segments.some(segment => segment.startsWith('.'))) {
      reply(404, 'Not found'); return;
    }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const allowed = relative.startsWith('assets/') || relative === 'og.png' ||
      /^[^/]+\.(?:html|css|js|mjs)$/.test(relative);
    if (!allowed) { reply(404, 'Not found'); return; }
    try {
      const filename = await realpath(path.join(base, relative));
      if (!filename.startsWith(`${base}${path.sep}`)) { reply(404, 'Not found'); return; }
      const info = await stat(filename);
      if (!info.isFile()) { reply(404, 'Not found'); return; }
      const content = await readFile(filename);
      response.writeHead(200, {
        'Content-Type': mime[path.extname(filename).toLowerCase()] || 'application/octet-stream',
        'Content-Length': content.byteLength,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (['ENOENT', 'ENOTDIR', 'EACCES'].includes(error.code)) reply(404, 'Not found');
      else { console.error(error.message); reply(500, 'Unable to serve this file'); }
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const server = createServer(createStaticHandler());
  server.on('error', error => { console.error(`Preview could not start: ${error.message}`); process.exitCode = 1; });
  server.listen(4193, '127.0.0.1', () => console.log('http://127.0.0.1:4193'));
}
