// Accessibility checks (build-plan 8.3): axe-core (incl. colour contrast) on every page at phone and
// desktop width, plus keyboard checks on the interactive pieces.
//   npm run verify:a11y            (needs a built site and Chrome/Edge)
import { createRequire } from 'node:module';
import { launch, serve, builtRoutes } from './_env.mjs';

const AXE = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const problems = [];
const note = (where, msg) => problems.push(`${where}: ${msg}`);

const { base, stop } = await serve(4398);
const browser = await launch();
let pages = 0;
try {
  const routes = await builtRoutes();
  for (const width of [360, 1440]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    for (const route of routes) {
      const page = await ctx.newPage();
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.addScriptTag({ path: AXE });
      const { violations } = await page.evaluate(
        (tags) => axe.run(document, { runOnly: tags }),
        TAGS,
      );
      pages++;
      for (const v of violations)
        note(
          `${route}@${width}`,
          `${v.id} (${v.impact}) ${v.nodes.length}× e.g. ${v.nodes[0].target.join(' ')}`,
        );
      await page.close();
    }
    await ctx.close();
  }

  // keyboard: focus order, visible focus, no trap
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  for (const route of [
    '/',
    '/about',
    '/publications',
    '/horizon-scans',
    '/odyssean-process/modelling',
    '/faq',
    '/contact',
  ]) {
    const page = await ctx.newPage();
    await page.goto(base + route, { waitUntil: 'networkidle' });
    const seen = new Set();
    for (let i = 0; i < 150; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          id: el.outerHTML.slice(0, 80),
          skip: el.classList.contains('skip-link'),
          ring:
            (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none',
          visible: r.width > 0 && r.height > 0,
        };
      });
      if (!info) continue;
      if (seen.has(info.id)) break;
      if (seen.size === 0 && !info.skip)
        note(`${route} keyboard`, `first Tab stop is not the skip link: ${info.id}`);
      seen.add(info.id);
      if (!info.ring) note(`${route} keyboard`, `no visible focus style on ${info.id}`);
      if (!info.visible) note(`${route} keyboard`, `focus lands on a hidden element ${info.id}`);
    }
    await page.close();
  }

  // keyboard operation of the widgets
  {
    const page = await ctx.newPage();
    await page.goto(base + '/odyssean-process/modelling', { waitUntil: 'networkidle' });
    await page.focus('[data-fan-input]');
    for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowRight');
    const reading = await page.$$eval('[data-below]', (r) =>
      r.find((e) => !e.hidden)?.textContent.trim(),
    );
    if (!reading?.startsWith('Long term'))
      note(
        '/odyssean-process/modelling keyboard',
        'arrow keys do not move the slider through all readings',
      );
    await page.goto(base + '/horizon-scans', { waitUntil: 'networkidle' });
    await page.locator('[data-pick]').nth(1).focus();
    await page.keyboard.press('Enter');
    if ((await page.$$eval('[data-pick]', (b) => b[1].getAttribute('aria-pressed'))) !== 'true')
      note('/horizon-scans keyboard', 'Enter does not select a signal');
    await page.close();
    const phone = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const p2 = await phone.newPage();
    await p2.goto(base + '/', { waitUntil: 'networkidle' });
    await p2.focus('.menu summary');
    await p2.keyboard.press('Enter');
    if (!(await p2.isVisible('.menu__panel a')))
      note('/ keyboard@360', 'Enter does not open the menu');
    await p2.keyboard.press('Tab');
    if (!(await p2.evaluate(() => document.activeElement.closest('.menu__panel'))))
      note('/ keyboard@360', 'Tab does not move into the open menu');
    await phone.close();
  }
  await ctx.close();
} finally {
  await browser.close();
  stop();
}
console.log(`${pages} page/width axe runs (${TAGS.join(', ')}) + keyboard checks`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n` + problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}
console.log('accessibility checks passed');
