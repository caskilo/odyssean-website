import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

export type ArtMeta = {
  status: 'placeholder' | 'final';
  source: string;
  notes?: string;
  mobile?: 'scales' | 'interim' | 'final';
  /** props the gallery passes when previewing this art on its own */
  demo?: Record<string, unknown>;
};

const components = import.meta.glob<{ default: AstroComponentFactory }>('../art/*/Art.astro', {
  eager: true,
});
const metas = import.meta.glob<{ default: ArtMeta }>('../art/*/meta.json', { eager: true });

const key = (path: string) => path.split('/').at(-2)!;

export const art = Object.fromEntries(
  Object.entries(components).map(([path, mod]) => {
    const meta = metas[path.replace('Art.astro', 'meta.json')]?.default;
    if (!meta) throw new Error(`art/${key(path)} has no meta.json`);
    return [key(path), { Component: mod.default, meta }];
  }),
);

export function getArt(name: string) {
  const a = art[name];
  if (!a) throw new Error(`unknown art "${name}" (known: ${Object.keys(art).join(', ')})`);
  return a;
}
