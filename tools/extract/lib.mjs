// Shared helpers for curation scripts: PDF naming, link rewriting to the new IA, image localisation.
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const SITE = join(here, '..', '..');
export const CONTENT = join(SITE, 'src', 'content');
export const MEDIA = join(SITE, 'src', 'assets', 'media');
export const CACHE = join(here, '..', '.cache');

/** Wix PDF id → public file name (build-plan task 1.5; identities verified by identify_pdfs.py). */
export const PDFS = {
  cad45f_0ddb2ff8abe74792af7dc19e63fd81d2: 'horizon-scan-global-catastrophic-risks-preprint',
  cad45f_5876f7d7692242179673c8ea6fd6a195: 'odyssean-process-policy-brief-2024',
  cad45f_63b8af0cc2724fae949ed95107400b90: 'odyssean-process-white-paper-2023',
  e56281_f0a77ff859354023bf743d07b9cea519: 'odyssean-process-white-paper-2024',
  e56281_eec666986781463f93290fa10c53732e: 'odyssean-process-white-paper-2024', // byte-identical duplicate
  cad45f_72bc5701e1de4685b9781276810ecb1f: 'grain-overview-report',
  cad45f_b15af802bd7540548c90b0639dbc329b: 'resilience-reconsidered-preprint',
  cad45f_fd6a6fe4045245db97bb5cac284a3196: 'bridging-the-intangible-neld-samoa',
  e5ae06_0c45281acce84b9198497299d9319fde: 'governance-under-fallout',
  e5ae06_1026479b2b3f4b55895adb8d877c0776: 'policy-robustness-uncertainty-energy-transition',
  e5ae06_1802664e01d343b982189da0012251dc:
    'bridging-local-technocratic-epistemologies-neld-pacific-preprint',
};
export const pdfPath = (id) => `/files/${PDFS[id]}.pdf`;

/** Old internal path → new path (build-plan B.2 "Retired"). Fragments are preserved. */
export const ROUTES = {
  '/our-work': '/',
  '/outputs': '/publications',
  '/cause-areas': '/focus',
  '/services-1': '/about',
  '/team': '/about#team',
  '/projects': '/projects',
  '/resilient-supply-chains': '/grain/methodology',
  '/neld': '/grain/reports',
};

export function rewriteHref(href) {
  if (!href) return href;
  let h = href.replace(/^https?:\/\/(www\.)?odysseaninstitute\.org/, '') || '/';
  const pdf = h.match(/\/_files\/ugd\/([0-9a-f]{6}_[0-9a-f]{32})\.pdf/);
  if (pdf) return PDFS[pdf[1]] ? pdfPath(pdf[1]) : h;
  const [path, frag] = h.split('#');
  if (ROUTES[path])
    return ROUTES[path].includes('#') ? ROUTES[path] : ROUTES[path] + (frag ? `#${frag}` : '');
  return h;
}

/** Rewrite every Markdown link target in a string. */
export const rewriteMarkdownLinks = (md) =>
  md.replace(/\]\(([^)\s]+)\)/g, (_, h) => `](${rewriteHref(h)})`);

export const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.(png|jpe?g|webp|gif)$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

const exists = (f) =>
  access(f).then(
    () => true,
    () => false,
  );

/**
 * Download a Wix image (original resolution) into src/assets/media/<group>/<name>.<ext>
 * and return its path relative to `fromFile` (for content frontmatter / Markdown).
 */
export async function localiseImage(url, group, name, fromFile) {
  const m = url.match(/static\.wixstatic\.com\/media\/([^/~]+)~mv2\.([a-z]+)/i);
  if (!m) throw new Error(`not a Wix media URL: ${url}`);
  const ext = m[2].toLowerCase() === 'jpeg' ? 'jpg' : m[2].toLowerCase();
  const file = join(
    MEDIA,
    group,
    `${slugify(name) || m[1].slice(7, 15)}-${m[1].slice(7, 13)}.${ext}`,
  );
  if (!(await exists(file))) {
    const res = await fetch(`https://static.wixstatic.com/media/${m[1]}~mv2.${m[2]}`);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  return relative(dirname(fromFile), file).replace(/\\/g, '/');
}

export const yamlStr = (s) => JSON.stringify(s); // JSON strings are valid YAML scalars
export { extname };
