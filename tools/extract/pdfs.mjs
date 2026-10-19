// Discover every /_files/ugd/*.pdf linked from the fetched live pages, download each once, and
// record where it is linked from (page, link text). Output: tools/.cache/pdfs/ + pdf-links.json
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { RAW } from './fetch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '.cache', 'pdfs');
await mkdir(OUT, { recursive: true });

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true }))
    e.isDirectory() ? yield* walk(join(dir, e.name)) : yield join(dir, e.name);
}

const links = {};
for await (const file of walk(RAW)) {
  const page =
    '/' +
    file
      .slice(RAW.length + 1)
      .replace(/\\/g, '/')
      .replace(/\.html$/, '')
      .replace(/^index$/, '');
  const $ = cheerio.load(await readFile(file, 'utf8'));
  $('a[href*="/ugd/"]').each((_, a) => {
    const href = $(a).attr('href');
    const m = href.match(/\/ugd\/([0-9a-f]{6}_[0-9a-f]{32})\.pdf/);
    if (!m) return;
    const label =
      $(a).text().replace(/\s+/g, ' ').trim() || ($(a).find('img').attr('alt') ?? '[image]');
    (links[m[1]] ??= []).push({ page, label: label.slice(0, 120), href });
  });
}

for (const id of Object.keys(links)) {
  const out = join(OUT, `${id}.pdf`);
  if (
    await access(out).then(
      () => true,
      () => false,
    )
  )
    continue;
  const res = await fetch(`https://www.odysseaninstitute.org/_files/ugd/${id}.pdf`);
  if (!res.ok) {
    console.log('FAILED', id, res.status);
    continue;
  }
  await writeFile(out, Buffer.from(await res.arrayBuffer()));
  console.log('downloaded', id);
}
await writeFile(join(OUT, 'pdf-links.json'), JSON.stringify(links, null, 2));
console.log(Object.keys(links).length, 'distinct PDFs');
