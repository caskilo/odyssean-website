// Live /team → src/content/team/<slug>.yaml (team, advisors, trustees). Build-plan task 1.2.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CACHE, CONTENT, localiseImage, rewriteMarkdownLinks, slugify, yamlStr } from './lib.mjs';

const md = await readFile(join(CACHE, 'md', 'team.md'), 'utf8');
const outDir = join(CONTENT, 'team');
await mkdir(outDir, { recursive: true });
const groups = { 'Our Team': 'team', Advisors: 'advisor', Trustees: 'trustee' };

let group = null;
let order = 0;
const people = [];
for (const chunk of md.split(/\n(?=#{2,3} )/)) {
  const [heading, ...rest] = chunk.trim().split('\n');
  if (heading.startsWith('## ')) {
    group = groups[heading.slice(3).trim()];
    if (!group) throw new Error(`unknown team group: ${heading}`);
    continue;
  }
  const name = heading.replace(/^### /, '').trim();
  const paras = rest
    .join('\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const imgIdx = paras.findIndex((p) => p.startsWith('!['));
  if (imgIdx < 0) throw new Error(`no photo for ${name}`);
  const role = imgIdx > 0 ? paras.slice(0, imgIdx).join(' ') : null;
  const [, alt, url] = paras[imgIdx].match(/!\[([^\]]*)\]\(([^)]+)\)/);
  const bio = rewriteMarkdownLinks(paras.slice(imgIdx + 1).join('\n\n'));
  people.push({ name, role, url, alt, bio, group, order: ++order });
}

for (const p of people) {
  const file = join(outDir, `${slugify(p.name)}.yaml`);
  const src = await localiseImage(p.url, 'team', p.name, file);
  const yaml = [
    `order: ${p.order}`,
    `group: ${p.group}`,
    `name: ${yamlStr(p.name)}`,
    p.role ? `role: ${yamlStr(p.role)}` : null,
    'photo:',
    `  src: ${yamlStr(src)}`,
    `  alt: ${yamlStr(p.name)}`, // live alt is the file name; the person's name is the accurate alt
    `bio: ${yamlStr(p.bio)}`,
    'sources:',
    '  - kind: live',
    '    ref: "https://www.odysseaninstitute.org/team"',
  ]
    .filter(Boolean)
    .join('\n');
  await writeFile(file, yaml + '\n');
}
console.table(people.map(({ name, role, group }) => ({ name, role, group })));
