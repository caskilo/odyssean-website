// Responsive audit (build-plan 7.1): every built route at 360 / 768 / 1024 / 1440.
//   npm run verify:responsive            (needs a built site)
// Fails on: horizontal scroll, tap targets under 44px and body text under 16px (both <=768 wide;
// mono labels and captions are exempt from the text rule).
import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { launch, serve, SITE } from './_env.mjs';

const WIDTHS = [360, 768, 1024, 1440];
const dist = join(SITE, 'dist');

async function routes(dir = dist) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await routes(p)));
    else if (e.name.endsWith('.html') && e.name !== '404.html') {
      const rel = relative(dist, p).split(sep).join('/').slice(0, -'.html'.length);
      out.push('/' + (rel === 'index' ? '' : rel.replace(/(^|[/])index$/, '')));
    }
  }
  return out.sort();
}

function audit(width) {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !el.closest('[hidden]');
  };
  const label = (el) =>
    (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40);
  const taps = [];
  if (width <= 768) {
    const sel = 'a, button, summary, input:not([type=hidden]), select, textarea';
    for (const el of document.querySelectorAll(sel)) {
      if (!visible(el) || el.closest('.skip-link')) continue;
      // inline links inside running text are exempt (WCAG 2.5.8)
      if (
        getComputedStyle(el).display === 'inline' &&
        el.closest('p, li, figcaption, td, dd, label')
      )
        continue;
      const r = el.getBoundingClientRect();
      if (r.width < 44 || r.height < 44)
        taps.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }
  const small = new Set();
  if (width <= 768)
    for (const el of document.querySelectorAll('main p, main li, main dd, main td')) {
      if (!visible(el) || !el.textContent.trim()) continue;
      if (
        !/mono/i.test(getComputedStyle(el).fontFamily) &&
        parseFloat(getComputedStyle(el).fontSize) < 16
      )
        small.add(`${label(el)} ${getComputedStyle(el).fontSize}`);
    }
  return {
    overflow: document.documentElement.scrollWidth - innerWidth,
    taps,
    small: [...small],
  };
}

const { base, stop } = await serve(4399);
const browser = await launch();
const problems = [];
let count = 0;
try {
  const list = await routes();
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    for (const route of list) {
      const page = await ctx.newPage();
      await page.goto(base + route, { waitUntil: 'networkidle' });
      const r = await page.evaluate(audit, width);
      count++;
      if (r.overflow > 0)
        problems.push({ width, route, msg: `horizontal scroll +${r.overflow}px` });
      for (const t of r.taps) problems.push({ width, route, msg: `tap target ${t}` });
      for (const s of r.small) problems.push({ width, route, msg: `small text ${s}` });
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}
console.log(`${count} page/width checks`);
if (problems.length) {
  const groups = new Map();
  for (const { width, route, msg } of problems) {
    const g = groups.get(msg) ?? new Map();
    g.set(route, [...(g.get(route) ?? []), width]);
    groups.set(msg, g);
  }
  for (const [msg, g] of groups) {
    const where = [...g].slice(0, 3).map(([r, w]) => `${r}@${w.join('/')}`);
    console.log(`${msg}  [${g.size} pages: ${where.join(', ')}${g.size > 3 ? ', …' : ''}]`);
  }
  console.log(`${problems.length} problems`);
  process.exit(1);
}
console.log('responsive checks passed');
