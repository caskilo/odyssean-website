import { getEntry } from 'astro:content';

export type Strand = 'info' | 'grain' | 'scans' | 'process';
export type Microsite = Exclude<Strand, 'info'>;

export async function getSettings() {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('src/content/settings/site.yaml is missing');
  return entry.data;
}

export const isMicrosite = (s: Strand): s is Microsite => s !== 'info';

/** Logo colourway that reads on each strand's ground. */
export const logoTone = (strand: Strand, dark = false) =>
  strand === 'scans' || dark ? ('paper' as const) : ('blue' as const);

export const isCurrent = (href: string, current: string) =>
  href === '/' ? current === '/' : current === href || current.startsWith(href + '/');
