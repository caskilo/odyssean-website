// Gate G1 content checks (build-plan F.1, E.2). Schema validity is checked by `astro sync`/build;
// this script checks the rules a schema can't:
//   1. copy parity    – every approved concept string appears verbatim in src/content
//   2. design notes   – none of the concept's design notes appear in src/content
//   3. requests       – every CR-### used in content is registered in docs/new-design/open-questions.md
//   4. internal links – every internal link resolves to a page, post, file or asset
//   5. references     – publication ids / contentFrom targets exist
// Exit code 1 on failure. Run: npm run verify:content
import { readFile, readdir, access } from 'node:fs/promises';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROOT = join(SITE, '..');
const CONTENT = join(SITE, 'src', 'content');
const failures = [];
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true }))
    e.isDirectory() ? yield* walk(join(dir, e.name)) : yield join(dir, e.name);
}
const exists = (f) =>
  access(f).then(
    () => true,
    () => false,
  );

const files = [];
for await (const f of walk(CONTENT))
  if (/\.(md|ya?ml)$/.test(f)) files.push({ path: f, text: await readFile(f, 'utf8') });
const norm = (s) =>
  s
    .replace(/\\(["'\\])/g, '$1')
    .replace(/''/g, "'")
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
const corpus = norm(files.map((f) => f.text).join('\n'));
// provenance notes may quote design notes when explaining that they are *not* used
const corpusWithoutNotes = norm(files.map((f) => f.text.replace(/^\s*note:.*$/gm, '')).join('\n'));

// ── 1 + 2: copy parity & design notes ─────────────────────────────────────
const slidesText = (
  await readFile(join(ROOT, 'docs', 'new-design', 'extracted', 'slides-text.md'), 'utf8')
).replace(/\r\n/g, '\n');
const ACTIVE = new Set(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
const DESIGN_NOTES = [
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
/** Superseded by agreed decisions (not design notes, but intentionally not used). */
const SUPERSEDED = {
  'Our work': 'main nav: dropped (OQ C4)',
  'Horizon Scan': 'main nav: replaced by Projects',
  Team: 'main nav: About (H1)',
  'Blog & commentary': 'renamed "Blog" (C2)',
  Commentary: 'blog posts are not listed in the register',
  'Odyssean Institute · Registered charity 1204794':
    'composed from settings (name · charity number)',
};
const isTrivial = (s) =>
  /^(\d+|[IVX]+|[.→·]|N|\d+ \/ \d+|\{\{.*\}\})$/.test(s) || /\[[^\]]*\]/.test(s);
let checked = 0;
for (const [, num, block] of slidesText.matchAll(
  /^## (\d\d) [^\n]*\n[\s\S]*?```text\n([\s\S]*?)```/gm,
)) {
  if (!ACTIVE.has(num)) continue;
  for (const line of block
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)) {
    if (isTrivial(line) || DESIGN_NOTES.includes(line) || SUPERSEDED[line]) continue;
    checked++;
    if (!corpus.includes(norm(line)))
      fail('copy', `slide ${num}: "${line}" not found in src/content`);
  }
}
// appendix tables (interactive states) and SVG labels
const appendix = slidesText.slice(slidesText.indexOf('## Appendix'));
for (const [, row] of appendix.matchAll(/^\| (?!-|Tab|Horizon)(.+) \|$/gm)) {
  for (const cell of row.split(' | ').slice(1)) {
    const c = cell.trim();
    if (!c || /^[<≥\d]/.test(c)) continue;
    checked++;
    if (!corpus.includes(norm(c))) fail('copy', `appendix: "${c}" not found in src/content`);
  }
}
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
for (const l of SVG_LABELS) {
  checked++;
  if (!corpus.includes(norm(l))) fail('copy', `art label "${l}" not found`);
}
for (const n of DESIGN_NOTES.filter((n) => n.length > 12))
  if (corpusWithoutNotes.includes(norm(n))) fail('design-note', `"${n}" appears in src/content`);

// ── 3: content requests ───────────────────────────────────────────────────
const oq = await readFile(join(ROOT, 'docs', 'new-design', 'open-questions.md'), 'utf8');
const registered = new Set([...oq.matchAll(/\bCR-\d{3}\b/g)].map((m) => m[0]));
const used = new Map();
for (const f of files)
  for (const [id] of f.text.matchAll(/\bCR-\d{3}\b/g))
    used.set(id, [...(used.get(id) ?? []), relative(CONTENT, f.path)]);
for (const [id, where] of used)
  if (!registered.has(id))
    fail(
      'requests',
      `${id} used in ${[...new Set(where)].join(', ')} but not in open-questions.md`,
    );

// images without alt text are tracked as one request (CR-003)
const noAlt = [];
for (const f of files) {
  for (const m of f.text.matchAll(/!\[\]\([^)]+\)/g))
    noAlt.push(`${relative(CONTENT, f.path)}: ${m[0].slice(4, -1).split('/').pop()}`);
  for (const _ of f.text.matchAll(/src:\s*"[^"]+"\n\s*alt:\s*""/g))
    noAlt.push(`${relative(CONTENT, f.path)}: (cover)`);
}
if (noAlt.length && !registered.has('CR-003'))
  fail('requests', `${noAlt.length} images without alt text but CR-003 is not registered`);

// ── 4: internal links ─────────────────────────────────────────────────────
const routes = new Set();
for (const f of files) {
  const rel = relative(CONTENT, f.path).replace(/\\/g, '/');
  if (rel.startsWith('pages/'))
    routes.add(
      '/' +
        rel
          .slice(6)
          .replace(/\.md$/, '')
          .replace(/(^|\/)index$/, ''),
    );
  if (rel.startsWith('posts/')) routes.add('/post/' + rel.slice(6).replace(/\.md$/, ''));
}
routes.add('/').delete('');
for (const f of files) {
  const targets = [
    ...f.text.matchAll(/\]\((\/[^)\s]*)\)/g),
    ...f.text.matchAll(/href:\s*['"]?(\/[^'"\s,}]*)/g),
  ].map((m) => m[1]);
  for (const t of targets) {
    const path = decodeURIComponent(t.split('#')[0].split('?')[0]) || '/';
    if (routes.has(path)) continue;
    if (path.startsWith('/files/') && (await exists(join(SITE, 'public', path)))) continue;
    fail('links', `${relative(CONTENT, f.path)} → ${t} does not resolve`);
  }
  for (const [, img] of f.text.matchAll(/\]\((\.\.?\/[^)\s]+)\)|src:\s*"(\.\.?\/[^"]+)"/g)) {
    if (img && !(await exists(join(dirname(f.path), img))))
      fail('links', `${relative(CONTENT, f.path)} → missing asset ${img}`);
  }
}

// ── 5: references ─────────────────────────────────────────────────────────
const pubIds = new Set(
  files
    .filter((f) => f.path.includes(`${join('content', 'publications')}`))
    .map((f) => f.path.split(/[\\/]/).pop().replace(extname(f.path), '')),
);
for (const f of files) {
  for (const [, list] of f.text.matchAll(/^publications:\s*\[([^\]]*)\]/gm))
    for (const id of list
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean))
      if (!pubIds.has(id))
        fail('refs', `${relative(CONTENT, f.path)}: unknown publication "${id}"`);
  for (const [, id] of f.text.matchAll(/^\s*publication:\s*(\S+)/gm))
    if (!pubIds.has(id)) fail('refs', `${relative(CONTENT, f.path)}: unknown publication "${id}"`);
  for (const [, id] of f.text.matchAll(/^contentFrom:\s*(\S+)/gm))
    if (!routes.has('/' + id))
      fail('refs', `${relative(CONTENT, f.path)}: contentFrom "${id}" is not a page`);
}

// ── report ────────────────────────────────────────────────────────────────
console.log(
  `content files: ${files.length} · routes: ${routes.size} · concept strings checked: ${checked} · content requests in use: ${[...used.keys()].sort().join(', ') || 'none'} · images without alt (CR-003): ${noAlt.length}`,
);
if (process.argv.includes('--list-alt')) console.log(noAlt.join('\n'));
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n` + failures.map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
console.log('content checks passed');
