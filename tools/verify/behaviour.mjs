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
    await page.waitForSelector('[data-filter-link="all"][aria-current]');
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
    const { page, close } = await open('/horizon-scans');
    const shown = await page.$$eval('[data-panel]', (p) => p.filter((e) => !e.hidden).length);
    check('signals: one card shown', shown === 1);
    await page.locator('[data-pick]').nth(2).click();
    check(
      'signals: pick 3 pressed, track lit',
      (await page.$$eval('[data-pick]', (b) => b[2].getAttribute('aria-pressed'))) === 'true' &&
        (await page.$eval('path[data-track="2"]', (t) => t.classList.contains('is-active'))),
    );
    await close();
  }
  {
    const { page, close } = await open('/horizon-scans', { js: false });
    const shown = await page.$$eval('[data-panel]', (p) => p.filter((e) => !e.hidden).length);
    check(
      'signals without JS: all cards listed, selector hidden',
      shown === 5 && !(await page.isVisible('[data-picker]')),
    );
    await close();
  }
  {
    const { page, close } = await open('/odyssean-process/modelling');
    const reading = () =>
      page.$$eval('[data-below]', (r) =>
        r.filter((e) => !e.hidden).map((e) => e.textContent.trim()),
      );
    const set = (v) =>
      page.$eval(
        '[data-fan-input]',
        (i, v) => {
          i.value = v;
          i.dispatchEvent(new Event('input', { bubbles: true }));
        },
        v,
      );
    const seen = [];
    for (const v of [4, 24, 50]) {
      await set(v);
      const r = await reading();
      seen.push(r.length === 1 ? r[0].split(':')[0] : '?');
    }
    check(
      'modelling: slider shows all 3 readings',
      seen.join() === 'Near term,Medium term,Long term',
      seen.join(),
    );
    check('modelling: year follows slider', (await page.textContent('[data-fan-year]')) === '2076');
    await close();
  }
  {
    const { page, close } = await open('/odyssean-process/modelling', { js: false });
    const shown = await page.$$eval('[data-below]', (r) => r.filter((e) => !e.hidden).length);
    check('modelling without JS: default reading only', shown === 1);
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
    // flags.contactForm is off until the mail handler exists (9.3): the page shows the email address instead
    const { page, close } = await open('/contact?sent=1');
    const hasForm = (await page.$('form[data-form]')) !== null;
    check(
      'contact: form hidden while there is no mail handler, address shown',
      !hasForm && (await page.isVisible('.contact-details a[href^="mailto:"]')),
    );
    await close();
  }
  {
    const { page, close } = await open('/grain/reports');
    const panel = (i) => page.locator('.site-header .drop').nth(i).locator('.drop__panel');
    check('menus: closed until hovered', !(await panel(0).isVisible()));
    await page.hover('.site-header .drop >> nth=0');
    check(
      'menus: Projects opens on hover with the three projects',
      (await panel(0).isVisible()) && (await panel(0).locator('a').count()) === 3,
    );
    await page.keyboard.press('Escape');
    check('menus: Escape closes it', !(await panel(0).isVisible()));
    await page.mouse.move(5, 700);
    await page.hover('.site-header .drop >> nth=1');
    const more = await panel(1).locator('a').allTextContents();
    check(
      'menus: More lists FAQ, Contact, Donate',
      more.map((t) => t.trim()).join() === 'FAQ,Contact,Donate',
      more.join(),
    );
    const box = await panel(1).boundingBox();
    check(
      'menus: the last menu stays inside the page',
      box !== null && box.x + box.width <= 1440,
      JSON.stringify(box),
    );
    await close();
  }
  {
    const { page, close } = await open('/about');
    check(
      'nav: current page is marked in the built site',
      (await page.$eval('.site-header__nav a[aria-current="page"]', (a) =>
        a.getAttribute('href'),
      )) === '/about',
    );
    await close();
  }
} finally {
  await browser.close();
  stop();
}
console.table(results);
if (results.some((r) => r.result === 'FAIL')) process.exit(1);
