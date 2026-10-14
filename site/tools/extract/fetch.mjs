// Fetches the live Wix pages that are content sources (build-plan B.2) into tools/.cache/raw/.
// Re-runnable: pass --force to refetch. Used again at launch for the delta pull (F.4 11.3).
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://www.odysseaninstitute.org';
const here = dirname(fileURLToPath(import.meta.url));
export const RAW = join(here, '..', '.cache', 'raw');

export const PAGES = [
  '/',
  '/team',
  '/faq',
  '/curriculum',
  '/contact',
  '/donate',
  '/donation-thank-you-page',
  '/blog',
  '/focus',
  '/grain',
  '/resilient-supply-chains',
  '/neld',
  '/publications',
  '/services-1',
];

async function postsFromFeed() {
  const xml = await (await fetch(`${ORIGIN}/blog-feed.xml`)).text();
  return [
    ...xml.matchAll(/<link>(https:\/\/www\.odysseaninstitute\.org\/post\/[^<]+)<\/link>/g),
  ].map((m) => new URL(m[1]).pathname);
}

export const fileFor = (path) =>
  join(RAW, (path === '/' ? 'index' : decodeURIComponent(path).slice(1)) + '.html');

const exists = (f) =>
  access(f).then(
    () => true,
    () => false,
  );

export async function fetchAll({ force = false } = {}) {
  const posts = await postsFromFeed();
  const all = [...PAGES, ...posts];
  for (const path of all) {
    const out = fileFor(path);
    if (!force && (await exists(out))) continue;
    const res = await fetch(ORIGIN + encodeURI(decodeURI(path)), {
      headers: { 'user-agent': 'odyssean-website-migration/1.0 (+contact@odysseaninstitute.org)' },
    });
    if (!res.ok) throw new Error(`${res.status} ${path}`);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, await res.text());
    console.log('fetched', path);
    await new Promise((r) => setTimeout(r, 400));
  }
  return { pages: PAGES, posts };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  await fetchAll({ force: process.argv.includes('--force') });
}
