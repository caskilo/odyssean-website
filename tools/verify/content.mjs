// Gate G1 content checks (build-plan F.1, E.2). Schema validity is checked by `astro sync`/build;
// this script checks the rules a schema can't:
//   1. copy parity    – every approved concept string appears verbatim in src/content
//   2. design notes   – none of the concept's design notes appear in src/content
//   3. requests       – every CR-### used in content is registered in docs/open-questions.md
//   4. internal links – every internal link resolves to a page, post, file or asset
//   5. references     – publication ids / contentFrom targets exist
// Exit code 1 on failure. Run: npm run verify:content
import { readFile, readdir, access } from 'node:fs/promises';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conceptStrings, norm, DESIGN_NOTE_PHRASES } from './_concept.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
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
const corpus = norm(files.map((f) => f.text).join('\n'));
// provenance notes may quote design notes when explaining that they are *not* used
const corpusWithoutNotes = norm(files.map((f) => f.text.replace(/^\s*note:.*$/gm, '')).join('\n'));

// ── 1 + 2: copy parity & design notes ─────────────────────────────────────
const concept = await conceptStrings();
const checked = concept.length;
for (const { where, text } of concept)
  if (!corpus.includes(norm(text))) fail('copy', `${where}: "${text}" not found in src/content`);
for (const n of DESIGN_NOTE_PHRASES)
  if (corpusWithoutNotes.includes(norm(n))) fail('design-note', `"${n}" appears in src/content`);

// ── 3: content requests ───────────────────────────────────────────────────
const oq = await readFile(join(SITE, 'docs', 'open-questions.md'), 'utf8');
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
