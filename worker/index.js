export default {
  async fetch(request, env) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', {status: 405, headers: {Allow: 'GET, HEAD'}});
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url).pathname); }
    catch { return new Response('Invalid request', {status: 400}); }
    if (pathname.includes('\\') || pathname.includes('\0') ||
      pathname.split('/').some(segment => segment.startsWith('.'))) {
      return new Response('Not found', {status: 404});
    }
    const relative = pathname.slice(1);
    if (pathname !== '/' && !relative.startsWith('assets/') && relative !== 'og.png' &&
      !/^[^/]+\.(?:html|css|js|mjs)$/.test(relative)) {
      return new Response('Not found', {status: 404});
    }
    // The asset binding resolves / to index.html and supplies its own 404s.
    // Preserve requests and responses so canonical paths, MIME and HEAD work.
    return env.ASSETS.fetch(request);
  }
};
