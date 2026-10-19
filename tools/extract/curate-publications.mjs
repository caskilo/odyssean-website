// Live /publications → src/content/publications/*.yaml (build-plan task 1.5).
// Each entry's link target was checked against the PDF's own first page (identify_pdfs.py);
// the live page links several titles/thumbnails/buttons to the wrong document.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CACHE, CONTENT, localiseImage, pdfPath, slugify, yamlStr } from './lib.mjs';

const live = JSON.parse(await readFile(join(CACHE, 'md', 'publications.json'), 'utf8'));
const blocks = live.blocks.slice(2); // [0] page banner image, [1] "## Publications"
const entries = [];
for (let i = 0; i < blocks.length; i += 4) {
  const [title, summary, thumb, button] = blocks.slice(i, i + 4);
  entries.push({ title, summary, thumb, button });
}

/** Verified metadata, in live order. Authors/dates are as printed on the document itself. */
const META = [
  {
    slug: 'bridging-the-intangible-neld-samoa',
    pdf: 'cad45f_fd6a6fe4045245db97bb5cac284a3196',
    type: 'research-report',
    programmes: ['grain'],
    authors: 'James Balzer',
    date: 'December 2025',
    status: 'verified',
    note: 'Title, thumbnail and Read All all point to the same PDF; matches its first page.',
  },
  {
    slug: 'governance-under-fallout',
    pdf: 'e5ae06_0c45281acce84b9198497299d9319fde',
    type: 'research-report',
    programmes: ['grain'],
    authors: 'Giuseppe Dal Prá, James Balzer et al.',
    status: 'corrected',
    note: 'Live "Read All" button points to e5ae06_1802… (Bridging local and technocratic epistemologies). Title and thumbnail point to the correct PDF.',
  },
  {
    slug: 'bridging-local-technocratic-epistemologies',
    pdf: 'e5ae06_1802664e01d343b982189da0012251dc',
    type: 'research-report',
    programmes: ['grain'],
    authors: 'James Balzer and Sivendra Michael',
    status: 'corrected',
    note: 'Live title links to cad45f_72bc… (GRAIN Overview Report). Thumbnail and Read All point to the correct pre-print.',
  },
  {
    slug: 'policy-robustness-uncertainty-energy-transition',
    pdf: 'e5ae06_1026479b2b3f4b55895adb8d877c0776',
    type: 'research-report',
    programmes: ['process'],
    authors: 'Ian J. Burton, Femke J.M.M. Nijsse, James M. Salter',
    status: 'corrected',
    note: 'Live title links to cad45f_72bc… (GRAIN Overview Report). Thumbnail and Read All point to the correct PDF.',
  },
  {
    slug: 'grain-overview-report',
    pdf: 'cad45f_72bc5701e1de4685b9781276810ecb1f',
    type: 'research-report',
    programmes: ['grain'],
    authors: 'Giuseppe Dal Prá, James Balzer, Roman Coussement, Christopher Yan-Chak Chan',
    date: 'June 2025',
    status: 'verified',
    note: 'All links point to the same PDF; matches its first page ("Overview Report, 17 June, 2025").',
  },
  {
    slug: 'horizon-scan-global-catastrophic-risks',
    pdf: 'cad45f_0ddb2ff8abe74792af7dc19e63fd81d2',
    type: 'research-report',
    programmes: ['scans'],
    authors: 'Giuseppe Dal Prá, Christopher Y. C. Chan, Timur Burkhanov et al.',
    date: '2024',
    status: 'corrected',
    note: 'Title, thumbnail and Read All are correct. Links inside the live summary text point to the White Paper (e56281_eec…); removed. Date "2024" from concept slide 5 ("Published 2024").',
  },
  {
    slug: 'resilience-reconsidered',
    url: 'https://link.springer.com/article/10.1007/s13753-025-00657-y',
    type: 'research-report',
    programmes: ['grain'],
    authors: 'Christopher Yan-Chak Chan, Giuseppe Dal Prá et al.',
    date: 'August 2025',
    status: 'corrected',
    note: 'Title, thumbnail and Read All go to the published article (Springer). Links inside the live summary text point to the White Paper (e56281_eec…); removed. Authors from the pre-print (cad45f_b15a…).',
  },
  {
    slug: 'odyssean-process-white-paper',
    pdf: 'e56281_f0a77ff859354023bf743d07b9cea519',
    type: 'white-paper',
    programmes: ['process'],
    authors: 'Giuseppe Dal Prá, Bilal-Imran Asghar, Christopher Chan',
    date: '2024',
    status: 'corrected',
    note: 'Live title links to the 2024 edition (e56281_f0a7…); thumbnail and Read All link to an older, different 2023 edition (cad45f_63b8…). The 2024 edition is used; the 2023 file stays available at its old URL. Year "2024" as cited on the live Curriculum page.',
  },
  {
    slug: 'odyssean-process-policy-brief',
    pdf: 'cad45f_5876f7d7692242179673c8ea6fd6a195',
    type: 'policy-brief',
    programmes: ['process'],
    authors: undefined,
    date: 'February 2024',
    status: 'verified',
    note: 'All links point to the same PDF; matches its first page ("POLICY BRIEF February 2024").',
  },
  {
    slug: 'master-equation-for-power-laws',
    url: 'https://royalsocietypublishing.org/doi/10.1098/rsos.220531',
    type: 'research-report',
    programmes: [],
    status: 'unverified',
    note: 'External journal link (Royal Society Open Science); not checked offline. Authors and date not stated on the live page.',
  },
];
if (META.length !== entries.length)
  throw new Error(`expected ${META.length} entries, found ${entries.length}`);

const outDir = join(CONTENT, 'publications');
await mkdir(outDir, { recursive: true });
const stripLinks = (md) => md.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
for (const [i, e] of entries.entries()) {
  const m = META[i];
  const file = join(outDir, `${m.slug}.yaml`);
  const title = stripLinks(e.title.md.replace(/^#+\s*/gm, ''))
    .replace(/\s*\n\s*/g, ' ')
    .trim();
  // keep links in the summary only when they are legitimate (entry 10's DOI link); else plain text
  const summary =
    m.slug === 'master-equation-for-power-laws' ? e.summary.md : stripLinks(e.summary.md);
  const thumb = await localiseImage(e.thumb.src, 'publications', m.slug, file);
  const yaml = [
    `order: ${i + 1}`,
    `title: ${yamlStr(title)}`,
    `type: ${m.type}`,
    `summary: ${yamlStr(summary.replace(/ {2,}/g, ' ').trim())}`,
    m.authors
      ? `authors: ${yamlStr(m.authors)}`
      : `authors:\n  request: CR-007\n  note: "Authors are not stated on the live page or the document."`,
    m.date
      ? `date: ${yamlStr(m.date)}`
      : `date:\n  request: CR-007\n  note: "Publication date is not stated on the live page or the document."`,
    m.pdf ? `file: ${pdfPath(m.pdf)}` : null,
    m.url ? `url: ${m.url}` : null,
    'thumbnail:',
    `  src: ${yamlStr(thumb)}`,
    `  alt: ${yamlStr(title)}`,
    `programmes: [${m.programmes.join(', ')}]`,
    'verification:',
    `  status: ${m.status}`,
    `  note: ${yamlStr(m.note)}`,
    'sources:',
    '  - kind: live',
    '    ref: "https://www.odysseaninstitute.org/publications"',
    ...(m.pdf ? ['  - kind: pdf', `    ref: ${yamlStr(m.pdf)}`] : []),
  ]
    .filter(Boolean)
    .join('\n');
  await writeFile(file, yaml + '\n');
  console.log(m.status.padEnd(11), slugify(title).slice(0, 50));
}
