// Visual comparison of built pages against the concept screenshots (build-plan 8.1, AD12).
// Concept frames are the first ~1000px of a page, so we compare that top region. Differences are
// expected where the build deliberately departs (real nav, footer); the output is for review.
//   npm run verify:visual              all configured pages
//   npm run verify:visual -- home      one page
// Needs a built site (npm run build) and Chrome/Edge (CHROME_PATH overrides the lookup).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { launch, serve, SITE } from './_env.mjs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const SHOTS = join(SITE, '..', 'docs', 'new-design', 'extracted', 'screenshots');
const OUT = join(SITE, 'test-results', 'visual');
const PORT = 4398;

/** page name → [route, concept screenshot, optional preparation] */
const PAGES = {
  home: ['/', '02-home.png'],
  projects: ['/projects', '05-projects.png'],
  publications: ['/publications', '06-publications.png'],
  about: ['/about#why', '10-origin-of-name.png'],
  'about-experts': ['/preview/about-experts-citizens#experts', '08-experts-citizens.png'],
  grain: ['/grain', '01-grain.png'],
  scans: ['/horizon-scans', '03-horizon-scan.png'],
  process: ['/odyssean-process', '04-odyssean-process.png'],
  modelling: ['/odyssean-process/modelling', '09-fan-of-futures.png'],
};

/** px of page above the compared region in the concept frame (its own header) */
const OFFSET = { about: 140 };

const want = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const names = want.length ? want : Object.keys(PAGES);
await mkdir(OUT, { recursive: true });

const { base, stop } = await serve(PORT);
const browser = await launch();
const rows = [];
try {
  for (const name of names) {
    const [route, concept] = PAGES[name] ?? [];
    if (!route) throw new Error(`unknown page "${name}" (known: ${Object.keys(PAGES).join(', ')})`);
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    });
    const res = await page.goto(base + route, { waitUntil: 'networkidle' });
    if (!res?.ok()) {
      rows.push({ page: name, route, result: `HTTP ${res?.status()}` });
      await page.close();
      continue;
    }
    await page.evaluate(() => document.fonts.ready);
    const target = new URL(route, base).hash;
    if (target)
      await page.evaluate(
        ([h, off]) => {
          document.querySelector(h)?.scrollIntoView();
          scrollBy(0, -off);
        },
        [target, OFFSET[name] ?? 0],
      );
    const siteBuf = await page.screenshot();
    await page.close();

    const a = PNG.sync.read(siteBuf);
    const b = PNG.sync.read(await readFile(join(SHOTS, concept)));
    const h = Math.min(a.height, b.height, 1000);
    const crop = (img) => {
      const out = new PNG({ width: 1440, height: h });
      PNG.bitblt(img, out, 0, 0, 1440, h, 0, 0);
      return out;
    };
    const [sa, sb] = [crop(a), crop(b)];
    const diff = new PNG({ width: 1440, height: h });
    const bad = pixelmatch(sa.data, sb.data, diff.data, 1440, h, { threshold: 0.15 });
    const side = new PNG({ width: 1440 * 3, height: h });
    for (const [i, img] of [sa, sb, diff].entries())
      PNG.bitblt(img, side, 0, 0, 1440, h, i * 1440, 0);
    await writeFile(join(OUT, `${name}.png`), PNG.sync.write(side));
    rows.push({
      page: name,
      route,
      mismatch: `${((bad / (1440 * h)) * 100).toFixed(1)}%`,
      file: `test-results/visual/${name}.png`,
    });
  }
} finally {
  await browser.close();
  stop();
}
console.table(rows);
console.log(
  'Each PNG: [site | concept | diff]. Review the differences; build departures (real nav, footer) are expected.',
);
