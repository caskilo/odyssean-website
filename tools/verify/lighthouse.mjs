// Lighthouse (build-plan 8.3): mobile profile on representative pages; every category must be >= 90.
//   npm run verify:lighthouse            (needs a built site and Chrome/Edge)
import lighthouse from 'lighthouse';
import { launch as launchChrome } from 'chrome-launcher';
import { chromePath, serve } from './_env.mjs';

const ALL = [
  '/',
  '/about',
  '/projects',
  '/publications',
  '/blog',
  '/post/our-2025-in-review',
  '/focus',
  '/grain',
  '/grain/reports',
  '/horizon-scans',
  '/odyssean-process',
  '/odyssean-process/modelling',
];
const PAGES =
  process.argv.length > 2 ? process.argv.slice(2).map((p) => '/' + p.replace(/^[/]/, '')) : ALL;
const MIN = 90;
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

const { base, stop } = await serve(4395);
const chrome = await launchChrome({
  chromePath: await chromePath(),
  chromeFlags: ['--headless=new', '--no-sandbox'],
});
const rows = [];
const problems = [];
try {
  for (const route of PAGES) {
    const { lhr } = await lighthouse(
      base + route,
      { port: chrome.port, output: 'json', logLevel: 'error' },
      { extends: 'lighthouse:default', settings: { onlyCategories: CATEGORIES } },
    );
    const row = { page: route };
    for (const c of CATEGORIES) {
      const score = Math.round(lhr.categories[c].score * 100);
      row[c] = score;
      if (score < MIN) {
        const failed = Object.values(lhr.audits)
          .filter(
            (a) =>
              lhr.categories[c].auditRefs.some((r) => r.id === a.id) &&
              a.score !== null &&
              a.score < 0.9,
          )
          .map((a) => a.id);
        problems.push(`${route}: ${c} ${score} (${failed.join(', ')})`);
      }
    }
    rows.push(row);
  }
} finally {
  await chrome.kill();
  stop();
}
console.table(rows);
if (problems.length) {
  console.error(
    `\n${problems.length} score(s) below ${MIN}:\n` + problems.map((p) => '  ' + p).join('\n'),
  );
  process.exit(1);
}
console.log(`lighthouse: all scores >= ${MIN}`);
