import { createMarkdownProcessor } from '@astrojs/markdown-remark';

const processor = await createMarkdownProcessor({ syntaxHighlight: false });

/** Render a Markdown string (summaries, bios, FAQ answers, sliced page bodies) to HTML. */
export async function md(source: string): Promise<string> {
  return (await processor.render(source)).code;
}

/** Split a Markdown body into an intro and `## ` sections (heading text → body). */
export function sections(body: string) {
  const [intro, ...rest] = body.split(/^## /m);
  return {
    intro: intro.trim(),
    sections: rest.map((chunk) => {
      const [heading, ...lines] = chunk.split('\n');
      return { heading: heading.trim(), body: lines.join('\n').trim() };
    }),
  };
}
