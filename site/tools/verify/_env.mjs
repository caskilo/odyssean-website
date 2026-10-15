// Shared by the verify tools: serve the built site and launch a system Chrome/Edge.
import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
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

export async function launch() {
  const found = (await Promise.all(CHROMES.map(async (c) => ((await exists(c)) ? c : null)))).find(
    Boolean,
  );
  if (!found) throw new Error('No Chrome/Edge found; set CHROME_PATH');
  return chromium.launch({ executablePath: found });
}

/** Serve ./dist with `astro preview`. Returns { base, stop }. */
export async function serve(port = 4398) {
  const server = spawn('npx', ['astro', 'preview', '--force', '--port', String(port)], {
    cwd: SITE,
    shell: true,
    stdio: 'ignore',
  });
  const base = `http://localhost:${port}`;
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
