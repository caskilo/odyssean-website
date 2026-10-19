// Art registry check + placeholder report (build-plan AD6, task 2.4).
// Every src/art/<key>/ needs Art.astro and a valid meta.json. Prints what is still a stand-in.
// Exit code 1 if any entry is malformed. Run: npm run report:placeholders
import { readdir, readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ART = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'art');
const STATUS = ['placeholder', 'final'];
const MOBILE = ['scales', 'interim', 'final'];
const problems = [];
const rows = [];

for (const e of await readdir(ART, { withFileTypes: true })) {
  if (!e.isDirectory()) continue;
  const dir = join(ART, e.name);
  const has = (f) =>
    access(join(dir, f)).then(
      () => true,
      () => false,
    );
  if (!(await has('Art.astro'))) problems.push(`${e.name}: missing Art.astro`);
  if (!(await has('meta.json'))) {
    problems.push(`${e.name}: missing meta.json`);
    continue;
  }
  const m = JSON.parse(await readFile(join(dir, 'meta.json'), 'utf8'));
  if (!STATUS.includes(m.status)) problems.push(`${e.name}: status must be one of ${STATUS}`);
  if (!m.source) problems.push(`${e.name}: source is required`);
  if (m.mobile && !MOBILE.includes(m.mobile))
    problems.push(`${e.name}: mobile must be one of ${MOBILE}`);
  if (m.mobile === 'final' && !(await has('Art.mobile.astro')))
    problems.push(`${e.name}: mobile "final" needs Art.mobile.astro`);
  rows.push({ key: e.name, status: m.status, mobile: m.mobile ?? 'n/a', source: m.source });
}

rows.sort((a, b) => a.status.localeCompare(b.status) || a.key.localeCompare(b.key));
console.table(rows);
const pending = rows.filter((r) => r.status === 'placeholder' || r.mobile === 'interim');
console.log(
  `${rows.length} art entries · ${pending.length} still stand-ins: ${pending.map((r) => r.key).join(', ') || 'none'}`,
);
if (problems.length) {
  console.error(problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}
