// Extract live Wix pages → intermediate Markdown + metadata in tools/.cache/md/.
// Curated content in src/content/ is produced from these by hand/AI review (build-plan P1);
// this step is mechanical and re-runnable (delta pull at launch, F.4 11.3).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { fetchAll, fileFor } from './fetch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '.cache', 'md');

/** Original asset URL from a Wix transformed media URL. */
export const wixOriginal = (src) => {
  if (!src) return src;
  const m = src.match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/]+)/);
  return m ? m[1].replace(/%7E/gi, '~') : src;
};

const isAnchorTarget = (n) =>
  n.nodeName === 'SPAN' && /^(ref|note|anchor)-/.test(n.getAttribute?.('id') || '');
const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  emDelimiter: '*',
  // Empty nodes bypass rules; keep our anchor targets, drop everything else as Turndown would.
  blankReplacement: (_, n) =>
    isAnchorTarget(n) ? `<span id="${n.getAttribute('id')}"></span>` : n.isBlock ? '\n\n' : '',
});
td.use(gfm);
td.keep(['sup', 'sub']);
// GFM cells must stay on one line: multi-paragraph cells become <br>-separated.
td.addRule('tableCellSingleLine', {
  filter: ['th', 'td'],
  replacement: (content, node) => {
    const first = [...node.parentNode.childNodes].indexOf(node) === 0;
    return (first ? '| ' : ' ') + content.trim().replace(/\s*\n+\s*/g, '<br>') + ' |';
  },
});
td.addRule('wixImage', {
  filter: 'img',
  replacement: (_, node) => {
    const alt = (node.getAttribute('alt') || '').replace(/\s+/g, ' ').trim();
    return `![${alt}](${wixOriginal(node.getAttribute('src'))})`;
  },
});
td.addRule('dropEmpty', {
  filter: (n) =>
    n.nodeName === 'SPAN' &&
    !n.textContent.trim() &&
    !n.querySelector('img') &&
    !n.getAttribute('id'),
  replacement: () => '',
});
td.addRule('underline', { filter: ['u'], replacement: (c) => c });

const clean = ($, el) => {
  const $el = $(el).clone();
  $el.find('svg, button, script, style, wow-image > div:empty').remove();
  $el.find('[aria-hidden="true"]').not(':has(img)').remove();
  $el.find('a').each((_, a) => {
    const href = $(a).attr('href');
    if (href) $(a).attr('href', href.replace(/^https:\/\/www\.odysseaninstitute\.org/, '') || '/');
  });
  return $el.html() || '';
};

const md = (html) =>
  td
    .turndown(html)
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\ufeff]/g, '')
    .replace(/^#{1,6}\s*$/gm, '')
    .replace(/\[\]\([^)\s]*\)/g, '') // empty links (Wix nests <a> in <a>)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const SUP = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
const supToInt = (s) => Number([...s].map((c) => SUP[c]).join(''));

/**
 * Post bodies: give in-page anchor targets stable ids (ref-N for "[N]" references, note-N for
 * superscript notes) via an inline <span id> that survives Markdown, and promote the first table
 * row to a header (Wix emits td-only tables). Returns issues found on the live page.
 */
function preparePostBody($, body) {
  const issues = [];
  const idFor = new Map();
  body.find('a[href^="#viewer-"]').each((_, a) => {
    const wixId = $(a).attr('href').slice(1);
    const target = body.find(`[id="${wixId}"]`).first();
    if (!target.length) {
      issues.push(`broken in-page link "${$(a).text()}" (#${wixId}) — link removed, text kept`);
      $(a).replaceWith($(a).html());
      return;
    }
    if (!idFor.has(wixId)) {
      const text = target.text().trim();
      const ref = text.match(/^\[(\d+)\]/);
      const sup = text.match(/^([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
      const id = ref
        ? `ref-${ref[1]}`
        : sup
          ? `note-${supToInt(sup[1])}`
          : `anchor-${wixId.slice(7)}`;
      idFor.set(wixId, id);
      target.prepend(`<span id="${id}"></span>`);
    }
    $(a).attr('href', `#${idFor.get(wixId)}`);
  });
  body.find('table').each((_, t) => {
    const cells = $(t).find('td, th');
    if (cells.length === 1) {
      // Wix "table" used as a highlighted box → blockquote
      $(t).replaceWith($('<blockquote></blockquote>').html(cells.first().html()));
      return;
    }
    $(t)
      .find('td, th')
      .each((_, cell) => {
        const paras = $(cell).find('p');
        if (paras.length)
          $(cell).html(
            paras
              .map((_, p) => $(p).html())
              .get()
              .join(' '),
          );
      });
    const first = $(t).find('tr').first();
    if (first.find('th').length) return;
    first.find('td').each((_, td) => (td.tagName = 'th'));
    $(t).find('tbody').first().before($('<thead></thead>').append(first));
  });
  body.find('[data-hook="gallery-viewer"]').each((_, g) => {
    // galleries wrap images in expand <button>s (stripped by clean): flatten to plain images
    const imgs = $(g)
      .find('img')
      .map((_, i) => `<p><img src="${$(i).attr('src')}" alt="${$(i).attr('alt') || ''}"></p>`)
      .get();
    $(g).replaceWith(imgs.join(''));
  });
  body.find('img').each((_, i) => {
    if (!($(i).attr('alt') || '').trim())
      issues.push(`image without alt text: ${wixOriginal($(i).attr('src'))}`);
  });
  return issues;
}

const meta = ($) => ({
  title: $('title').first().text().trim(),
  description: $('meta[name="description"]').attr('content') || null,
  ogImage: wixOriginal($('meta[property="og:image"]').attr('content') || null),
  canonical: $('link[rel="canonical"]').attr('href') || null,
});

function extractPage($) {
  const root = $('#PAGES_CONTAINER').length ? $('#PAGES_CONTAINER') : $('main');
  const blocks = [];
  const seen = new Set();
  root.find('[data-testid="richTextElement"], img, a[data-testid="linkElement"]').each((_, el) => {
    if ([...seen].some((s) => $(s).find(el).length)) return; // nested inside a captured block
    const $el = $(el);
    if (el.tagName === 'img') {
      if ($el.closest('[data-testid="richTextElement"]').length) return;
      blocks.push({
        kind: 'image',
        src: wixOriginal($el.attr('src')),
        alt: ($el.attr('alt') || '').trim(),
      });
    } else if ($el.is('a')) {
      const label =
        $el.find('[data-testid="stylablebutton-label"]').text().trim() || $el.text().trim();
      if (!label || $el.closest('[data-testid="richTextElement"]').length) return;
      blocks.push({
        kind: 'button',
        label,
        href: ($el.attr('href') || '').replace(/^https:\/\/www\.odysseaninstitute\.org/, '') || '/',
      });
    } else {
      seen.add(el);
      const text = md(clean($, el));
      if (text) blocks.push({ kind: 'text', md: text });
    }
  });
  return blocks;
}

function extractPost($) {
  const ld = JSON.parse($('script[type="application/ld+json"]').first().html() || '{}');
  const body = $('[data-id="content-viewer"]').first();
  const issues = preparePostBody($, body);
  return {
    issues,
    headline:
      cheerio.load(`<p>${ld.headline ?? ''}</p>`).text() ||
      $('[data-hook="post-title"]').first().text().trim(),
    author: ld.author?.name || $('[data-hook="user-name"]').first().text().trim(),
    datePublished: ld.datePublished || null,
    dateModified: ld.dateModified || null,
    image:
      wixOriginal(Array.isArray(ld.image) ? ld.image[0]?.url : ld.image?.url || ld.image) || null,
    readTime: $('[data-hook="time-to-read"]').first().text().trim() || null,
    body: md(clean($, body)),
  };
}

const { pages, posts } = await fetchAll({ force: process.argv.includes('--force') });
await mkdir(join(OUT, 'post'), { recursive: true });
const index = [];
for (const path of [...pages, ...posts]) {
  const $ = cheerio.load(await readFile(fileFor(path), 'utf8'));
  const isPost = path.startsWith('/post/');
  const data = { path, ...meta($), ...(isPost ? extractPost($) : { blocks: extractPage($) }) };
  const name = path === '/' ? 'index' : decodeURIComponent(path).slice(1);
  await writeFile(join(OUT, name + '.json'), JSON.stringify(data, null, 2));
  const text = isPost
    ? `# ${data.headline}\n\n${data.body}`
    : data.blocks
        .map((b) =>
          b.kind === 'text'
            ? b.md
            : b.kind === 'image'
              ? `![${b.alt}](${b.src})`
              : `[[button: ${b.label} → ${b.href}]]`,
        )
        .join('\n\n');
  await writeFile(join(OUT, name + '.md'), text + '\n');
  index.push({
    path,
    chars: text.length,
    ...(isPost ? { issues: data.issues.length } : { blocks: data.blocks.length }),
  });
  if (isPost) data.issues.forEach((i) => console.log(`  ! ${path}: ${i}`));
}
console.table(index);
