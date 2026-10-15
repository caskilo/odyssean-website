// Browser checks for the interactive pieces, with JS on and off. Needs a built site.
//   npm run verify:behaviour
import { launch, serve } from './_env.mjs';

const { base, stop } = await serve(4396);
const browser = await launch();
const results = [];
const check = (name, ok, detail = '') =>
  results.push({ check: name, result: ok ? 'pass' : 'FAIL', detail });

async function open(path, { width = 1440, js = true } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    javaScriptEnabled: js,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  return { page, close: () => ctx.close() };
}

try {
  {
    const { page, close } = await open('/');
    const active = () =>
      page.$$eval('[data-slide]', (s) => s.map((x) => x.classList.contains('is-active')));
    check('carousel: first slide active', (await active()).join() === 'true,false,false');
    await page.click('[data-dot]:nth-child(2)');
    check('carousel: dot 2 shows slide 2', (await active()).join() === 'false,true,false');
    check('carousel: counter updates', (await page.textContent('[data-current]')) === '02');
    check(
      'carousel: aria-current moves',
      (await page.getAttribute('[data-dot]:nth-child(2)', 'aria-current')) === 'true',
    );
    await close();
  }
  {
    const { page, close } = await open('/', { js: false });
    const active = await page.$$eval('[data-slide]', (s) =>
      s.map((x) => x.classList.contains('is-active')),
    );
    check('carousel without JS: first slide visible', active.join() === 'true,false,false');
    await close();
  }
  {
    const { page, close } = await open('/publications#policy-brief');
    const visible = await page.$$eval('[data-type]', (els) =>
      els.filter((e) => !e.hidden).map((e) => e.dataset.type),
    );
    check(
      'filter: policy brief only',
      visible.length > 0 && visible.every((t) => t === 'policy-brief'),
      visible.join(),
    );
    await page.click('[data-filter-link="all"]');
    await page.waitForFunction(() => location.hash === '#all');
    const all = await page.$$eval('[data-type]', (els) => els.filter((e) => !e.hidden).length);
    const total = await page.$$eval('[data-type]', (els) => els.length);
    check('filter: all restores every row', all === total, `${all}/${total}`);
    await close();
  }
  {
    const { page, close } = await open('/publications', { js: false });
    const hidden = await page.$$eval('[data-type]', (els) => els.filter((e) => e.hidden).length);
    check('filter without JS: nothing hidden', hidden === 0);
    await close();
  }
  {
    const { page, close } = await open('/', { width: 390 });
    check('mobile: desktop nav hidden', !(await page.isVisible('.site-header__nav')));
    check('mobile: menu button visible', await page.isVisible('.menu summary'));
    await page.click('.menu summary');
    check(
      'mobile: menu opens with links',
      (await page.$$eval('.menu__panel a', (a) => a.length)) >= 4 &&
        (await page.isVisible('.menu__panel')),
    );
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check('mobile: no horizontal overflow (home)', overflow <= 0, `${overflow}px`);
    await close();
  }
  {
    const { page, close } = await open('/faq');
    await page.click('.faq details:first-of-type summary');
    check('faq: item opens', await page.$eval('.faq details:first-of-type', (d) => d.open));
    await close();
  }
  {
    const { page, close } = await open('/focus');
    await page.click('.pills a:nth-child(2)');
    check(
      'focus: pill jumps to its section',
      (await page.evaluate(() => location.hash)) === '#anticipatingglobalresilience',
    );
    await close();
  }
  {
    const { page, close } = await open('/contact?sent=1');
    check('contact: success message appears after submit', await page.isVisible('.form__success'));
    await close();
  }
} finally {
  await browser.close();
  stop();
}
console.table(results);
if (results.some((r) => r.result === 'FAIL')) process.exit(1);
