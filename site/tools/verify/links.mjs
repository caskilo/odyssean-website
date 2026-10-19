// Link check (build-plan 8.6). Internal links and #anchors must resolve (failure). External links are
// only reported, never fixed: pass --external to test them over the network.
//   npm run verify:links                 internal only (needs a built site, no browser)
//   npm run verify:links -- --external   also test every external URL, write test-results/links-external.md
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import * as cheerio from 'cheerio';
import { SITE } from './_env.mjs';

const dist = join(SITE, 'dist');
const external = process.argv.includes('--external');
const isFile = (f) =>
  stat(f).then(
    (s) => s.isFile(),
    () => false,
  );

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
const fileFor = async (path) => {
  const base =
    path === '/' ? join(dist, 'index.html') : join(dist, ...decodeURIComponent(path).split('/'));
  for (const f of [base, base + '.html']) if (await isFile(f)) return f;
};

const pages = new Map();
for (const file of await htmlFiles())
  pages.set(routeOf(file), cheerio.load(await readFile(file, 'utf8')));
const ids = (route) =>
  new Set(
    pages
      .get(route)?.('[id]')
      .map((_, el) => el.attribs.id)
      .get(),
  );

const problems = [];
const externals = new Map();
let internal = 0;
for (const [route, $] of pages) {
  const refs = $('a[href]:not([data-filter-link]), link[href], [src]')
    .map((_, el) => el.attribs.href ?? el.attribs.src)
    .get();
  for (const href of refs) {
    if (!href || /^(mailto:|tel:|data:|javascript:)/.test(href)) continue;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (!href.startsWith('https://www.odysseaninstitute.org'))
        externals.set(href, [...(externals.get(href) ?? []), route]);
      continue;
    }
    internal++;
    const url = new URL(href, 'https://x.test/');
    const target = href.startsWith('#') ? route : decodeURIComponent(url.pathname);
    if (!href.startsWith('#') && !(await fileFor(target)))
      problems.push(`${route}: ${href} does not exist`);
    const hash = decodeURIComponent(url.hash.slice(1));
    if (hash && pages.has(target) && !ids(target).has(hash))
      problems.push(`${route}: ${href} → no #${hash} on ${target}`);
  }
}
console.log(
  `${pages.size} pages · ${internal} internal references · ${externals.size} external URLs`,
);

if (external) {
  const results = [];
  const queue = [...externals];
  const check = async ([url, from]) => {
    const attempt = async (method) => {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; OdysseanLinkCheck/1.0)' },
      });
      return res.status;
    };
    let status;
    try {
      status = await attempt('HEAD');
      if (status >= 400) status = await attempt('GET');
    } catch (e) {
      status = e.cause?.code ?? e.name;
    }
    results.push({ url, status, from: [...new Set(from)] });
  };
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (let item; (item = queue.shift());) await check(item);
    }),
  );
  const bad = results.filter((r) => typeof r.status !== 'number' || r.status >= 400);
  const group = (title, note, test) => {
    const rows = bad.filter((r) => test(r.status)).sort((x, y) => x.url.localeCompare(y.url));
    return [
      `## ${title} (${rows.length})`,
      '',
      note,
      '',
      '| Status | URL | Used on |',
      '|--------|-----|---------|',
      ...rows.map((r) => `| ${r.status} | ${r.url} | ${r.from.join(', ')} |`),
      '',
    ];
  };
  const lines = [
    `# External link report (${new Date().toISOString().slice(0, 10)})`,
    '',
    `${results.length} external URLs checked, ${bad.length} did not answer normally. Reported, not fixed (build-plan 8.6).`,
    '',
    ...group(
      'Probably gone',
      'The server says the page does not exist, or the address no longer resolves. These need a decision.',
      (c) => c === 404 || c === 410 || c === 'ENOTFOUND',
    ),
    ...group(
      'No answer',
      'Timed out or refused the connection from this machine. Re-test by hand; many are slow academic sites.',
      (c) => typeof c !== 'number' && c !== 'ENOTFOUND',
    ),
    ...group(
      'Blocks automated checks',
      'Publishers and news sites that refuse scripted requests (401, 403, 406, 429). Almost certainly fine in a browser; spot-check a few.',
      (c) => typeof c === 'number' && c !== 404 && c !== 410,
    ),
  ];
  await mkdir(join(SITE, 'test-results'), { recursive: true });
  await writeFile(join(SITE, 'test-results', 'links-external.md'), lines.join('\n'));
  console.log(
    `${bad.length} of ${results.length} external URLs not reachable → test-results/links-external.md`,
  );
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n` + problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}
console.log('internal link checks passed');
