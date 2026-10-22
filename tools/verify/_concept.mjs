// The approved concept copy and the design notes that must never ship (build-plan 8.2, E.2).
// Shared by verify:content (checks src/content) and verify:built (checks the rendered HTML).
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const norm = (s) =>
  s
    .replace(/\\(["'\\])/g, '$1')
    .replace(/''/g, "'")
    .replace(/[*_`]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

const ACTIVE = new Set(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
export const DESIGN_NOTES = [
  'Room 1 — Current work',
  '3 panels',
  'Archive →',
  'Each panel opens a full project page in the same format',
  'Homepage · Focus areas',
  'Our mark,',
  'three ways in.',
  'The same mark at every scale',
  'Favicon',
  'Loader',
  'Section marker',
  'Footer lockup',
  'Explore',
];
/** Long enough to be searched for as a substring. */
export const DESIGN_NOTE_PHRASES = DESIGN_NOTES.filter((n) => n.length > 12);
/** Superseded by agreed decisions (not design notes, but intentionally not used). */
const SUPERSEDED = {
  'Our work': 'main nav: dropped (OQ C4)',
  'Horizon Scan': 'main nav: replaced by Projects',
  Team: 'main nav: About (H1)',
  'Blog & commentary': 'renamed "Blog" (C2)',
  Commentary: 'blog posts are not listed in the register',
  'Policy brief, Feb 2026': 'date corrected to Feb 2024 to match the document (2026-10-19)',
  'Odyssean Institute · Registered charity 1204794':
    'composed from settings (name · charity number)',
};
const SVG_LABELS = [
  'chokepoint',
  'nodes of persisting recovery',
  'origin',
  'destination',
  'Today',
  'Chart of the Odyssean Process · Sheet 1',
  'Better',
  'Worse',
  'Natural sciences',
  'Social sciences',
  'Odyssean',
];
const isTrivial = (s) =>
  /^(\d+|[IVX]+|[.→·]|N|\d+ \/ \d+|\{\{.*\}\})$/.test(s) || /\[[^\]]*\]/.test(s);

/** Every approved concept string: slide text, interactive-state appendix, art labels. */
export async function conceptStrings() {
  const slidesText = (await readFile(join(SITE, 'docs', 'slides-text.md'), 'utf8')).replace(
    /\r\n/g,
    '\n',
  );
  const out = [];
  for (const [, num, block] of slidesText.matchAll(
    /^## (\d\d) [^\n]*\n[\s\S]*?```text\n([\s\S]*?)```/gm,
  )) {
    if (!ACTIVE.has(num)) continue;
    for (const line of block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)) {
      if (isTrivial(line) || DESIGN_NOTES.includes(line) || SUPERSEDED[line]) continue;
      out.push({ where: `slide ${num}`, text: line });
    }
  }
  const appendix = slidesText.slice(slidesText.indexOf('## Appendix'));
  for (const [, row] of appendix.matchAll(/^\| (?!-|Tab|Horizon)(.+) \|$/gm))
    for (const cell of row.split(' | ').slice(1)) {
      const c = cell.trim();
      if (c && !/^[<≥\d]/.test(c)) out.push({ where: 'appendix', text: c });
    }
  for (const text of SVG_LABELS) out.push({ where: 'art label', text });
  return out;
}
