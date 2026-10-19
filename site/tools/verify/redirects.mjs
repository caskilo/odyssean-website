// Redirect check (build-plan 8.5): replays dist/.htaccess against every old URL and every built page,
// the way Apache would, and confirms each ends on a real file with no loops.
// This is a local simulation. The same URLs are re-tested on the real server in P9 (9.4).
//   npm run verify:redirects            (needs a built site)
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';
import { SITE, builtRoutes } from './_env.mjs';

const dist = join(SITE, 'dist');
const legacy = JSON.parse(await readFile(join(SITE, 'tools', 'redirects', 'legacy.json'), 'utf8'));
const htaccess = await readFile(join(dist, '.htaccess'), 'utf8');
const isFile = (f) =>
  stat(f).then(
    (s) => s.isFile(),
    () => false,
  );

const rules = [...htaccess.matchAll(/^RewriteRule \^(\S+)\$ (\S+) \[([^\]]*)\]$/gm)]
  .map(([, pattern, target, flags]) => ({ re: new RegExp(`^${pattern}$`), target, flags }))
  .filter((r) => r.flags.includes('R=301') && !r.target.includes('$'));
const stripSlash = htaccess.includes('RewriteRule ^(.+)/$ /$1 [R=301,L]');

/** One request → { status, location? }. Mirrors the rules in .htaccess. */
async function request(path) {
  if (stripSlash && path.length > 1 && path.endsWith('/'))
    return { status: 301, location: path.slice(0, -1) };
  for (const r of rules) if (r.re.test(path.slice(1))) return { status: 301, location: r.target };
  const file =
    path === '/' ? join(dist, 'index.html') : join(dist, ...decodeURIComponent(path).split('/'));
  if (await isFile(file)) return { status: 200, file };
  if (await isFile(file + '.html')) return { status: 200, file: file + '.html' };
  return { status: 404 };
}

async function follow(path) {
  const seen = [];
  let current = path;
  for (let hop = 0; hop < 5; hop++) {
    const res = await request(current.split('#')[0].split('?')[0]);
    if (res.status === 200) return { ...res, hops: seen.length, fragment: current.split('#')[1] };
    if (res.status === 404) return { status: 404, hops: seen.length, last: current };
    seen.push(current);
    current = res.location;
  }
  return { status: 'loop', hops: seen.length, last: current };
}

const cases = new Set();
const sources = { ...legacy.pages, ...legacy.feeds, ...legacy.pdfs };
for (const from of Object.keys(sources)) {
  cases.add(from);
  if (!from.endsWith('.pdf')) cases.add(from + '/');
  if (from.endsWith('.pdf')) cases.add(from + '?dn=download.pdf');
}
for (const route of await builtRoutes()) {
  cases.add(route);
  if (route !== '/') cases.add(route + '/');
}
cases.add('/blog-feed.xml');
cases.add('/robots.txt');

const problems = [];
let redirected = 0;
for (const path of [...cases].sort()) {
  const res = await follow(path);
  if (res.status !== 200)
    problems.push(`${path} → ${res.status}${res.last ? ` at ${res.last}` : ''}`);
  else if (res.hops) redirected++;
  if (res.status === 200 && res.fragment) {
    const $ = load(await readFile(res.file, 'utf8'));
    if (!$(`[id="${res.fragment}"]`).length)
      problems.push(`${path} → #${res.fragment} is not an anchor on the target`);
  }
}
console.log(
  `${cases.size} URLs replayed · ${redirected} redirected · ${rules.length} redirect rules`,
);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n` + problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}
console.log('redirect checks passed');
