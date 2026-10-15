// Full-page screenshots of routes at a given width, for review and the responsive pass.
//   npm run shots -- about faq               (1440 wide)
//   npm run shots -- --width 390 about
// Writes test-results/shots/<width>/<route>.png. Needs a built site.
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { launch, serve, SITE } from './_env.mjs';

const args = process.argv.slice(2);
const wi = args.indexOf('--width');
const width = wi >= 0 ? Number(args[wi + 1]) : 1440;
// no leading slash needed (Git Bash rewrites /paths); `home` is /
const routes = args
  .filter((a, i) => !a.startsWith('--') && (wi < 0 || i !== wi + 1))
  .map((a) => (a === 'home' ? '/' : a.startsWith('/') ? a : `/${a}`));
const out = join(SITE, 'test-results', 'shots', String(width));
await mkdir(out, { recursive: true });

const { base, stop } = await serve(4397);
const browser = await launch();
try {
  for (const route of routes) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const res = await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      const imgs = [...document.images];
      imgs.forEach((i) => (i.loading = 'eager'));
      await Promise.all(
        imgs.map((i) =>
          i.complete ? null : new Promise((r) => ((i.onload = r), (i.onerror = r))),
        ),
      );
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const name = (route === '/' ? 'index' : route.slice(1)).replace(/[^\w-]+/g, '_');
    await page.screenshot({ path: join(out, `${name}.png`), fullPage: true });
    console.log(
      `${res?.status()} ${route} → ${name}.png${overflow > 0 ? `  ⚠ horizontal overflow ${overflow}px` : ''}`,
    );
    await page.close();
  }
} finally {
  await browser.close();
  stop();
}
