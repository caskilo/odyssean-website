// Generate docs/content-map.md from src/content (build-plan task 1.1). Never edit the output by hand:
// provenance lives in each entry's `sources`, and gaps are typed content requests in the entry itself.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONTENT = join(SITE, 'src', 'content');
const OUT = join(SITE, '..', 'docs', 'content-map.md');

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true }))
    e.isDirectory() ? yield* walk(join(dir, e.name)) : yield join(dir, e.name);
}
const load = async (f) => {
  const text = await readFile(f, 'utf8');
  if (f.endsWith('.md')) {
    const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    return { data: parse(m[1]), body: m[2].trim() };
  }
  return { data: parse(text), body: '' };
};
/** Collect {path, request, note} for every content request inside an object. */
const requests = (o, path = []) =>
  o && typeof o === 'object'
    ? o.request && o.note
      ? [{ field: path.join('.'), id: o.request, note: o.note }]
      : Object.entries(o).flatMap(([k, v]) => (k === 'sources' ? [] : requests(v, [...path, k])))
    : [];
const route = (rel) => '/' + rel.replace(/\.md$/, '').replace(/(^|\/)index$/, '');
const srcCell = (sources) =>
  sources
    .map(
      (s) =>
        `${{ concept: '🎨', live: '🌐', pdf: '📄', decision: '⚖️' }[s.kind]} ${s.kind === 'concept' ? `slide ${s.ref}` : s.ref.replace('https://www.odysseaninstitute.org', '') || '/'}`,
    )
    .join('<br>');
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

const pages = [],
  collections = {},
  allRequests = [];
for await (const f of walk(CONTENT)) {
  const rel = relative(CONTENT, f).replace(/\\/g, '/');
  if (!/\.(md|ya?ml)$/.test(rel)) continue;
  const { data, body } = await load(f);
  const reqs = requests(data);
  allRequests.push(...reqs.map((r) => ({ ...r, file: rel })));
  if (rel.startsWith('pages/')) pages.push({ rel: rel.slice(6), data, body, reqs });
  else {
    const c = rel.split('/')[0];
    (collections[c] ??= []).push({ rel, data, reqs });
  }
}

const STRANDS = {
  info: 'Info strand',
  grain: 'GRAIN microsite',
  scans: 'Horizon Scans microsite',
  process: 'Odyssean Process microsite',
};
let md = `# Content map

> **Generated** by \`site/tools/report/content-map.mjs\` from \`site/src/content\`. Do not edit by hand. Re-run with \`npm run report:content-map\`.
> Build-plan task 1.1 · Gate G1. Every page lists its sources (🎨 concept · 🌐 live site · 📄 PDF · ⚖️ agreed decision); gaps are typed **content requests** (CR-###), registered in [new-design/open-questions.md](new-design/open-questions.md).

## Pages

`;
for (const [strand, label] of Object.entries(STRANDS)) {
  md += `### ${label}\n\n| Route | Template | Sources | Body | Open requests |\n|---|---|---|---|---|\n`;
  for (const p of pages
    .filter((p) => p.data.strand === strand)
    .sort((a, b) => route(a.rel).localeCompare(route(b.rel)))) {
    const body = p.body ? `${p.body.split(/\s+/).length} words` : '—';
    const reqs = p.reqs.map((r) => `${r.id} (${r.field})`).join('<br>') || '—';
    md += `| \`${route(p.rel)}\` | ${p.data.template} | ${srcCell(p.data.sources)} | ${body} | ${reqs} |\n`;
  }
  md += '\n';
}

md += `## Collections

| Collection | Entries | Sources | Open requests |\n|---|---:|---|---|\n`;
for (const [c, items] of Object.entries(collections).sort()) {
  const kinds = [...new Set(items.flatMap((i) => (i.data.sources ?? []).map((s) => s.kind)))];
  const reqs = [...new Set(items.flatMap((i) => i.reqs.map((r) => r.id)))].join(', ') || '—';
  md += `| ${c} | ${items.length} | ${kinds.join(', ')} | ${reqs} |\n`;
}

const pubs = (collections.publications ?? []).sort((a, b) => a.data.order - b.data.order);
md += `\n## Publications: verification (task 1.5)\n\n| # | Title | Link | Status | Note |\n|---:|---|---|---|---|\n`;
for (const p of pubs)
  md += `| ${p.data.order} | ${esc(p.data.title)} | \`${p.data.file ?? p.data.url}\` | ${p.data.verification.status} | ${esc(p.data.verification.note)} |\n`;

md += `\n## Content requests in use\n\n| ID | Where | Field | Note |\n|---|---|---|---|\n`;
const byId = {};
for (const r of allRequests) (byId[r.id] ??= []).push(r);
for (const [id, rs] of Object.entries(byId).sort())
  md += `| ${id} | ${[...new Set(rs.map((r) => r.file))].map((f) => `\`${f}\``).join('<br>')} | ${[...new Set(rs.map((r) => r.field))].join(', ')} | ${esc(rs[0].note)} |\n`;

await writeFile(OUT, md);
console.log(
  `wrote ${relative(join(SITE, '..'), OUT)}: ${pages.length} pages, ${Object.keys(byId).length} request ids`,
);
