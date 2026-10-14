// 9 blog posts → src/content/posts/<slug>.md (build-plan task 1.3). Mechanical; review follows.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CACHE, CONTENT, localiseImage, rewriteMarkdownLinks, slugify, yamlStr } from './lib.mjs';

// Wix blog listing alt text per cover image (used when the post body image has no alt)
const listing = JSON.parse(await readFile(join(CACHE, 'md', 'blog.json'), 'utf8'));
const listingAlt = Object.fromEntries(
  listing.blocks
    .filter((b) => b.kind === 'image' && b.src?.includes('wixstatic'))
    .map((b) => [b.src, b.alt]),
);

const dir = join(CACHE, 'md', 'post');
const outDir = join(CONTENT, 'posts');
await mkdir(outDir, { recursive: true });
const report = [];

for (const f of (await readdir(dir)).filter((f) => f.endsWith('.json'))) {
  const p = JSON.parse(await readFile(join(dir, f), 'utf8'));
  const slug = decodeURIComponent(p.path.replace('/post/', ''));
  const file = join(outDir, `${slug}.md`);
  let body = rewriteMarkdownLinks(p.body);
  // localise every inline image
  const imgs = [
    ...body.matchAll(/!\[([^\]]*)\]\((https:\/\/static\.wixstatic\.com\/media\/[^)\s]+)\)/g),
  ];
  let n = 0;
  let coverAlt = null;
  for (const [i, [all, alt, url]] of imgs.entries()) {
    const local = await localiseImage(url, `posts/${slugify(slug)}`, alt || `image-${++n}`, file);
    if (i === 0) coverAlt = alt || listingAlt[url.replace(/~mv2\.jpeg$/, '~mv2.jpeg')] || '';
    body = body.replace(all, `![${alt}](${local})`);
  }
  // cover = first body image (Wix uses it as the post hero and listing thumbnail)
  const first = body.match(/!\[([^\]]*)\]\(([^)\s]+)\)/);
  if (first) first[1] = coverAlt ?? first[1];
  const fm = [
    '---',
    `title: ${yamlStr(p.headline)}`,
    p.description ? `description: ${yamlStr(p.description)}` : null,
    `author: ${yamlStr(p.author)}`,
    `published: ${p.datePublished}`,
    p.dateModified && p.dateModified !== p.datePublished ? `updated: ${p.dateModified}` : null,
    p.readTime ? `readTime: ${yamlStr(p.readTime)}` : null,
    first ? `cover:\n  src: ${yamlStr(first[2])}\n  alt: ${yamlStr(first[1])}` : null,
    'sources:',
    `  - kind: live\n    ref: ${yamlStr('https://www.odysseaninstitute.org' + p.path)}`,
    '---',
  ]
    .filter(Boolean)
    .join('\n');
  // the page renders the title from frontmatter, and the cover image as hero: drop both from the body
  body = body.replace(/^# .*\n+/, '');
  if (first) body = body.replace(first[0], '').replace(/^\s+/, '');
  await writeFile(file, `${fm}\n\n${body}\n`);
  report.push({ slug: slug.slice(0, 50), images: imgs.length, issues: p.issues.length });
}
console.table(report);
