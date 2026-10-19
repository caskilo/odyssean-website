// Shared by the verify tools: serve the built site and launch a system Chrome/Edge.
import { spawn } from 'node:child_process';
import { access, readdir } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

export const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const exists = (f) =>
  access(f).then(
    () => true,
    () => false,
  );

export async function chromePath() {
  const found = (await Promise.all(CHROMES.map(async (c) => ((await exists(c)) ? c : null)))).find(
    Boolean,
  );
  if (!found) throw new Error('No Chrome/Edge found; set CHROME_PATH');
  return found;
}

export async function launch() {
  return chromium.launch({ executablePath: await chromePath() });
}

/** Serve ./dist with `astro preview`. Returns { base, stop }. */
export async function serve(port = 4398) {
  const server = spawn(
    'npx',
    ['astro', 'preview', '--force', '--port', String(port), '--host', '127.0.0.1'],
    {
      cwd: SITE,
      shell: true,
      stdio: 'ignore',
    },
  );
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  const stop = () => {
    server.kill();
    spawn('npx', ['astro', 'preview', 'stop'], { cwd: SITE, shell: true, stdio: 'ignore' });
  };
  return { base, stop };
}

/** Every built page as a public route, e.g. dist/grain/reports.html → /grain/reports. */
export async function builtRoutes(dir = join(SITE, 'dist')) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await builtRoutes(p)));
    else if (e.name.endsWith('.html') && e.name !== '404.html') {
      const rel = relative(join(SITE, 'dist'), p)
        .split(sep)
        .join('/')
        .replace(/\.html$/, '');
      out.push('/' + (rel === 'index' ? '' : rel));
    }
  }
  return out.sort();
}
