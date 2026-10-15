// Append verbatim live-page Markdown (from tools/.cache/md) to hand-written page frontmatter.
// Each job picks a slice of the extracted page, rewrites links to the new IA and localises images.
// Re-runnable: replaces everything after the frontmatter.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CACHE, CONTENT, localiseImage, rewriteMarkdownLinks, slugify } from './lib.mjs';

const src = (name) => readFile(join(CACHE, 'md', `${name}.md`), 'utf8');
/** Lines [from, to) of an extracted page, 1-based like `sed -n`. */
const lines = (md, from, to = Infinity) =>
  md
    .split('\n')
    .slice(from - 1, to === Infinity ? undefined : to - 1)
    .join('\n');
const dropButtons = (md) => md.replace(/^\[\[button:.*\]\]\s*$/gm, '');

async function localise(md, group, file) {
  for (const [all, alt, url] of [
    ...md.matchAll(/!\[([^\]]*)\]\((https:\/\/static\.wixstatic\.com\/media\/[^)\s]+)\)/g),
  ]) {
    const local = await localiseImage(url, group, alt || 'image', file);
    md = md.replace(all, `![${alt.replace(/\.(png|jpe?g|webp)$/i, '')}](${local})`);
  }
  return md;
}

/** GitHub-style heading slug (matches Astro's heading ids). */
const headingSlug = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');

/**
 * Curriculum: the live page uses heading tags for body text and citations. Restore semantics
 * without changing words: intro → paragraphs/list, TOC → in-page anchors, each reading → a list
 * item (link + citation), sub-group labels → h4. Topic names come from the live overview list.
 */
function curriculum(md) {
  const blocks = md
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const out = [];
  const topics = [];
  let region = 'intro';
  let reading = null;
  const flush = () => {
    if (!reading) return;
    const cite = reading.cite.filter((c) => c && c !== '\\-' && c !== '-').join(' ');
    out.push(`- ${reading.link}${cite ? `  \n  ${cite}` : ''}`);
    reading = null;
  };
  for (const b of blocks) {
    if (b.startsWith('![') || b === '# Curriculum') continue; // decorative banner; page heading comes from frontmatter
    if (b === '## Overview') {
      region = 'overview';
      out.push(b);
      continue;
    }
    if (b === '## Topics' || b === '## Techniques') {
      flush();
      region = 'list';
      out.push(b);
      continue;
    }
    if (region === 'intro') {
      out.push(
        b.replace(/^(-\s+)?#{1,6}\s*/gm, (_, li) => (li ? '- ' : '')).replace(/^-\s{2,}/gm, '- '),
      );
      continue;
    }
    if (region === 'overview') {
      const toc = b
        .replace(/\[([^\]]*)\]\(\/curriculum\)/g, '$1')
        .replace(/\\\./g, '.')
        .replace(/\s+/g, ' ')
        .trim();
      const m = toc.match(/^(\d+)\.\s*(.+)$/);
      if (m) {
        topics.push(m[2]);
        out.push(`${m[1]}. [${m[2]}](#${headingSlug(m[2])})`);
      } else out.push(b);
      continue;
    }
    // list region
    const h = b.match(/^###\s+(.*)$/s);
    if (h && topics.includes(h[1].trim())) {
      flush();
      out.push(`### ${h[1].trim()}`);
      continue;
    }
    if (
      /^\[[^\]]+\]\([^)]+\)(,?\s*\[[^\]]+\]\([^)]+\)|\s*&\s*\[[^\]]+\]\([^)]+\))*$/.test(
        b.replace(/\n/g, ' '),
      )
    ) {
      flush();
      reading = { link: b.replace(/\s*\n\s*/g, ' '), cite: [] };
      continue;
    }
    // on the live page every citation block starts with a heading tag; group labels never do
    if (reading && b.startsWith('###')) {
      reading.cite.push(
        b
          .replace(/^###\s*/gm, '')
          .replace(/\s*\n\s*/g, ' ')
          .trim(),
      );
      continue;
    }
    flush();
    out.push(`#### ${b.replace(/\s*\n\s*/g, ' ')}`); // sub-group label, e.g. "Case Studies"
  }
  flush();
  // consecutive list items belong to one list
  return out
    .join('\n\n')
    .replace(/\n\n(?=- \[)/g, '\n')
    .replace(/(\d+\. \[[^\n]+)\n\n(?=\d+\. \[)/g, '$1\n');
}

const between = (md, start, end) => {
  const i = md.indexOf(start);
  const j = end ? md.indexOf(end, i + start.length) : -1;
  if (i < 0) throw new Error(`marker not found: ${start}`);
  return md.slice(i, j < 0 ? undefined : j);
};

/** Raise heading levels by one (### → ##), never above h2. */
const raiseHeadings = (md) => md.replace(/^(#{3,6}) /gm, (_, h) => `${h.slice(1)} `);

const JOBS = {
  curriculum: async () => curriculum(await src('curriculum')),
  // old /grain: heading + logo replaced by concept 01; keep the full prose
  'grain/index': async () => between(await src('grain'), 'The GRAIN Initiative is'),
  // old /resilient-supply-chains, verbatim (its own "##" heading becomes a section heading)
  'grain/methodology': async () => await src('resilient-supply-chains'),
  contact: async () => between(await src('contact'), 'Please reach out', 'Thanks for submitting!'),
  // the intro + buttons are frontmatter (lede, actions); body = closing paragraph and photos
  donate: async () => between(await src('donate'), 'Please [contact us]'),
  // "NN" item numbers are presentational; #### question → ##, ##### sub-heading → ###
  faq: async () =>
    (await src('faq'))
      .replace(/^## FAQ\s*$/m, '')
      .replace(/^\d{2}\s*$/gm, '')
      .replace(/^##### /gm, '### ')
      .replace(/^#### /gm, '## '),
  // live /focus: intro paragraphs + the long-form sections (the teaser cards are replaced by concept 7)
  focus: async () => {
    const md = await src('focus');
    return [lines(md, 3, 9), lines(md, 45)].join('\n\n');
  },
};

for (const [page, job] of Object.entries(JOBS)) {
  const file = join(CONTENT, 'pages', `${page}.md`);
  const current = await readFile(file, 'utf8');
  const fm = current.match(/^---\n[\s\S]*?\n---\n/)[0];
  let body = rewriteMarkdownLinks(dropButtons(await job()));
  body = await localise(body, `pages/${slugify(page)}`, file);
  await writeFile(file, `${fm}\n${body.replace(/\n{3,}/g, '\n\n').trim()}\n`);
  console.log('body written:', page, body.length, 'chars');
}
