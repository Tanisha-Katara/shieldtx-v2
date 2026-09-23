import {copyFile, mkdir, readFile, readdir, rm, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'dist');
const client = path.join(source, 'client');
const server = path.join(source, 'server');
const staticExtensions = new Set(['.html', '.css', '.js', '.mjs']);

async function filesUnder(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Static assets must not be symbolic links: ${relative}`);
    if (entry.isDirectory()) files.push(...await filesUnder(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

function referencedAssets(text, extension) {
  const patterns = extension === '.html' ? [/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi] :
    extension === '.css' ? [/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi] :
    [/\b(?:import|export)\s+(?:[^;\n]*?\s+from\s*)?["']([^"']+)["']/g, /\bimport\(\s*["']([^"']+)["']/g];
  return patterns.flatMap(pattern => [...text.matchAll(pattern)].map(match => match[1]));
}

async function build() {
  const entries = await readdir(source, {withFileTypes: true});
  const files = entries.filter(entry => entry.isFile() &&
    (staticExtensions.has(path.extname(entry.name)) || entry.name === 'og.png')).map(entry => entry.name);
  files.push(...(await filesUnder(path.join(source, 'assets'))).map(file => `assets/${file}`));
  const available = new Set(files);
  for (const required of ['index.html', 'style.css', 'app.js', 'model.js']) {
    if (!available.has(required)) throw new Error(`Missing required static source: dist/${required}`);
  }

  // Catch broken local links and imports before replacing the last build.
  for (const file of files) {
    const extension = path.extname(file);
    if (!staticExtensions.has(extension)) continue;
    const text = await readFile(path.join(source, file), 'utf8');
    for (const reference of referencedAssets(text, extension)) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) continue;
      const pathname = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
      if (!pathname) continue;
      const relative = pathname.startsWith('/') ? pathname.slice(1) : path.posix.join(path.posix.dirname(file), pathname);
      const normalized = path.posix.normalize(relative || 'index.html');
      if (!available.has(normalized)) throw new Error(`Missing asset "${reference}" referenced by dist/${file}`);
    }
  }

  const worker = path.join(root, 'worker/index.js');
  await stat(worker);
  await rm(client, {recursive: true, force: true});
  await rm(server, {recursive: true, force: true});
  await mkdir(client, {recursive: true});
  await mkdir(server, {recursive: true});
  for (const file of files) {
    const destination = path.join(client, file);
    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(path.join(source, file), destination);
  }
  await copyFile(worker, path.join(server, 'index.js'));

  const hostingSource = path.join(root, '.openai/hosting.json');
  let hosting;
  try { hosting = await readFile(hostingSource, 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (hosting !== undefined) {
    const metadata = JSON.parse(hosting);
    if (typeof metadata.project_id !== 'string' || !metadata.project_id) throw new Error('Hosting metadata requires project_id');
    await mkdir(path.join(source, '.openai'), {recursive: true});
    await copyFile(hostingSource, path.join(source, '.openai/hosting.json'));
  }
  console.log(`Built ${files.length} static files in dist/client and the Worker in dist/server.`);
}

build().catch(error => {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
});
