import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPage, getPosts, excerpt } from '../lib/content';
import { text } from '../lib/copy';
import { getSettings } from '../lib/site';

export async function GET(context: APIContext) {
  const [settings, home, posts] = await Promise.all([
    getSettings(),
    getPage('index', 'home'),
    getPosts(),
  ]);
  return rss({
    title: `${settings.name} | Blog`,
    description: text(home.data.description) ?? settings.name,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.published,
      link: `/post/${p.id}`,
      description: p.data.description ?? excerpt(p.body),
      author: p.data.author,
    })),
  });
}
