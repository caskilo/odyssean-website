import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

type PageEntry = CollectionEntry<'pages'>;
export type Template = PageEntry['data']['template'];
export type PageOf<K extends Template> = Omit<PageEntry, 'data'> & {
  data: Extract<PageEntry['data'], { template: K }>;
};

/** A page by content id, checked against the template the caller expects. */
export async function getPage<K extends Template>(id: string, template: K): Promise<PageOf<K>> {
  const entry = await getEntry('pages', id);
  if (!entry) throw new Error(`pages/${id} not found`);
  if (entry.data.template !== template)
    throw new Error(`pages/${id} is template "${entry.data.template}", expected "${template}"`);
  return entry as PageOf<K>;
}

export const getPosts = async () =>
  (await getCollection('posts')).sort((a, b) => +b.data.published - +a.data.published);

export const getPublications = async () =>
  (await getCollection('publications')).sort((a, b) => a.data.order - b.data.order);

type PublicationEntry = CollectionEntry<'publications'>;
/** The document a publication links to (the schema guarantees a file or a url). */
export const publicationHref = (p: PublicationEntry) => (p.data.file ?? p.data.url)!;
/** Authors and date, skipping pending content requests. */
export const publicationMeta = (p: PublicationEntry) =>
  [p.data.authors, p.data.date].filter((v) => typeof v === 'string') as string[];

export const getTeam = async () =>
  (await getCollection('team')).sort((a, b) => a.data.order - b.data.order);

export const getSignals = async () =>
  (await getCollection('signals')).sort((a, b) => a.data.rank - b.data.rank);

export const getQuotes = async () =>
  (await getCollection('quotes')).sort((a, b) => a.data.order - b.data.order);

/** "Sep 2026": built from the date, not copy. */
export const monthYear = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(d);
