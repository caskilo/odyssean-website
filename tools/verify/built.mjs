// Checks the built site in dist/ (build-plan 8.2, 8.4): copy parity, design notes, metadata, structure.
//   npm run verify:built            (needs a built site; no browser required)
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import * as cheerio from 'cheerio';
import { conceptStrings, norm, DESIGN_NOTE_PHRASES } from './_concept.mjs';
import { SITE } from './_env.mjs';

const dist = join(SITE, 'dist');
const ORIGIN = 'https://www.odysseaninstitute.org';
const failures = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);

async function htmlFiles(dir = dist) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const routeOf = (file) => {
  const rel = relative(dist, file)
    .split(sep)
    .join('/')
    .replace(/\.html$/, '');
  return '/' + (rel === 'index' ? '' : rel);
};

const pages = [];
for (const file of await htmlFiles()) {
  const $ = cheerio.load(await readFile(file, 'utf8'));
  const route = routeOf(file);
  $('script, style, noscript').remove();
  pages.push({
    route,
    $,
    text: norm($('body').text()),
    noindex: $('meta[name=robots]').attr('content') === 'noindex',
  });
}
const shipped = pages.filter((p) => !p.route.startsWith('/preview/'));

// 8.2 copy parity: every approved concept string is rendered somewhere
const concept = await conceptStrings();
for (const { where, text } of concept)
  if (!pages.some((p) => p.text.includes(norm(text))))
    fail('copy', `${where}: "${text}" is not on any page`);
// 8.2 design notes: none rendered anywhere
for (const n of DESIGN_NOTE_PHRASES)
  for (const p of shipped)
    if (p.text.includes(norm(n))) fail(p.route, `design note "${n}" is rendered`);

// 8.4 per-page metadata and structure
const requests = new Map();
for (const { route, $, text, noindex } of pages) {
  const internal = route.startsWith('/preview/');
  const title = $('title').text().trim();
  if (!title) fail(route, 'missing <title>');
  if (!$('html').attr('lang')) fail(route, 'missing html lang');
  if (!noindex && !$('meta[name=description]').attr('content'))
    fail(route, 'missing meta description');
  if (!$('meta[property="og:title"]').attr('content')) fail(route, 'missing og:title');
  if (!$('meta[property="og:image"]').attr('content')) fail(route, 'missing og:image');
  const canonical = $('link[rel=canonical]').attr('href');
  if (canonical !== ORIGIN + (route === '/' ? '/' : encodeURI(route)))
    fail(route, `canonical is ${canonical}`);
  const h1 = $('h1').length;
  if (!internal && h1 !== 1) fail(route, `${h1} h1 elements`);
  let last = 0;
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = Number(el.tagName[1]);
    if (!internal && last && level > last + 1)
      fail(route, `heading jumps h${last} → h${level} ("${$(el).text().trim().slice(0, 40)}")`);
    last = level;
  });
  $('img').each((_, el) => {
    if ($(el).attr('alt') === undefined) fail(route, `image without alt: ${$(el).attr('src')}`);
  });
  if (/\[object Object\]|\bundefined\b|\bNaN\b/.test(text))
    fail(route, 'rendered text contains undefined/[object Object]/NaN');
  if (route.startsWith('/preview/') || route === '/404' || route === '/donation-thank-you-page')
    if (!noindex) fail(route, 'should be noindex');
  if (
    noindex &&
    !route.startsWith('/preview/') &&
    route !== '/404' &&
    route !== '/donation-thank-you-page'
  )
    fail(route, 'noindex on an indexable page');
  $('[data-request]').each((_, el) => {
    const id = $(el).attr('data-request');
    requests.set(id, new Set([...(requests.get(id) ?? []), route]));
  });
}

// 8.4 sitemap lists every indexable page and no noindex page
const sitemap = await readFile(join(dist, 'sitemap-0.xml'), 'utf8');
const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
for (const { route, noindex } of pages) {
  const url = ORIGIN + encodeURI(route);
  if (noindex && listed.has(url)) fail(route, 'noindex page is in the sitemap');
  if (!noindex && !listed.has(url)) fail(route, 'indexable page is missing from the sitemap');
}

console.log(`${pages.length} pages · ${concept.length} concept strings`);
for (const [id, routes] of [...requests].sort())
  console.log(`  open request ${id} shown on ${[...routes].sort().join(', ')}`);
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n` + failures.map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
console.log('built-site checks passed');
