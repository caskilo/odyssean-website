/**
 * Content model (build-plan AD5). All site copy lives in src/content/ and is validated here.
 * Rules: no copy in components · concept text is verbatim · every entry records its sources ·
 * a missing piece of copy is a typed content request ({ request: 'CR-001', note }) not a guess.
 * Human/LLM guide: ../CONTENT.md
 */
import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// ── primitives ──────────────────────────────────────────────────────────────

export const contentRequest = z.object({
  request: z.string().regex(/^CR-\d{3}$/, 'content request ids look like CR-001'),
  note: z.string(),
});
/** A piece of copy, or a request for it. */
const copy = z.union([z.string().min(1), contentRequest]);

const source = z.object({
  kind: z.enum(['concept', 'live', 'pdf', 'decision']),
  ref: z.string(),
  note: z.string().optional(),
});
const sources = z.array(source).min(1);

const strand = z.enum(['info', 'grain', 'scans', 'process']);
const artKey = z.string().regex(/^[a-z0-9-]+$/);
const href = z
  .string()
  .regex(/^(\/|#|https?:\/\/|mailto:|tel:)/, 'links must be absolute paths or URLs');

const link = z.object({ label: copy, href });
/** A button. Its target may itself be pending (e.g. a document that doesn't exist yet). */
const action = z.object({
  label: copy,
  href: z.union([href, contentRequest]),
  style: z.enum(['primary', 'secondary', 'accent']).default('primary'),
});
/** Display headline: roman text followed by an italic accent phrase in the theme accent colour. */
const headline = z.object({ text: copy, accent: copy.optional() });
const numbered = z.object({ numeral: z.string(), title: copy, body: copy });

const img = (image: SchemaContext['image']) =>
  z.object({
    src: image(),
    alt: z.union([z.string(), contentRequest]),
    credit: z.string().optional(),
  });

const base = {
  title: copy, // <title> / page heading where the template has no separate heading
  description: copy.optional(), // meta description
  strand,
  noindex: z.boolean().default(false),
  sources,
};

// ── page templates (discriminated on `template`) ───────────────────────────

const pageSchema = ({ image }: SchemaContext) =>
  z.discriminatedUnion('template', [
    z.object({
      ...base,
      template: z.literal('home'),
      hero: z.object({
        headline,
        lede: copy,
        slides: z.array(z.object({ art: artKey })).length(3), // same hero text on every slide (agreed default)
      }),
      focus: z.object({
        heading: copy,
        more: link,
        cards: z
          .array(
            z.object({
              area: z.enum(['institutions', 'wellbeing', 'resilience']),
              label: copy,
              title: copy,
              note: copy,
              href,
            }),
          )
          .length(3),
      }),
    }),
    z.object({
      ...base,
      template: z.literal('projects'),
      heading: copy,
      panels: z
        .array(
          z.object({
            number: z.string(),
            art: artKey,
            theme: z.enum(['grain', 'scans', 'process']),
            label: copy,
            status: copy,
            heading: copy,
            summary: copy,
            href,
          }),
        )
        .length(3),
    }),
    z.object({
      ...base,
      template: z.literal('publications'),
      eyebrow: copy,
      heading: copy,
      filterLabel: copy,
      filters: z.array(
        z.object({
          label: copy,
          type: z.enum(['all', 'policy-brief', 'white-paper', 'research-report']).optional(),
          href: href.optional(),
        }),
      ),
      typeLabels: z.object({ 'policy-brief': copy, 'white-paper': copy, 'research-report': copy }),
      // the featured block carries its own (concept) wording; the publication record keeps the document's title
      featured: z.object({
        publication: z.string(),
        label: copy,
        title: copy,
        summary: copy,
        cta: copy,
        fileLabel: copy,
        cover: z.object({ kicker: copy, title: copy }),
      }),
    }),
    z.object({
      ...base,
      template: z.literal('about'),
      splash: z.object({ heading: copy.optional(), body: copy }),
      origin: z.object({
        eyebrow: copy,
        headline,
        items: z.array(numbered).length(3),
        figure: z.object({
          art: artKey,
          labels: z.array(copy).length(3),
          description: copy,
          caption: copy,
        }),
        cta: z.object({ text: copy, action: link }),
      }),
      team: z.object({ heading: copy, advisorsHeading: copy, trusteesHeading: copy }),
      expertsCitizens: z.object({ eyebrow: copy, headline, cta: link }),
    }),
    z.object({
      ...base,
      template: z.literal('focus'),
      heading: copy,
      areas: z
        .array(
          z.object({
            anchor: z.string(), // preserves live-site fragment ids
            name: copy,
            body: copy,
            quote: copy,
            attribution: copy,
            detailHeading: copy.optional(),
          }),
        )
        .length(3),
    }),
    z.object({
      ...base,
      template: z.literal('faq'),
      heading: copy, // body: one "## Question" heading per item, answer below it
    }),
    z.object({
      ...base,
      template: z.literal('blog'),
      heading: copy,
    }),
    z.object({
      ...base,
      template: z.literal('grain-landing'),
      eyebrow: copy,
      headline,
      lede: copy,
      actions: z.array(action).max(2),
      figure: z.object({
        // GRAIN landing
        art: artKey,
        caption: copy,
        labels: z.object({ origin: copy, destination: copy, chokepoint: copy, nodes: copy }),
      }),
      pillars: z.array(z.object({ kicker: copy, title: copy, body: copy })).length(3),
    }),
    z.object({
      ...base,
      template: z.literal('scans-landing'),
      eyebrow: copy,
      headline,
      aside: copy,
      originLabel: copy,
      signalLabel: copy,
      readMore: link,
    }),
    z.object({
      ...base,
      template: z.literal('process-landing'),
      eyebrow: copy,
      headline,
      aside: copy,
      chartTitle: copy,
      ports: z.array(z.object({ label: copy, title: copy, body: copy, href })).length(3),
    }),
    z.object({
      ...base,
      template: z.literal('modelling'),
      eyebrow: copy,
      headline,
      aside: copy,
      axis: z.object({ better: copy, worse: copy }),
      slider: z.object({
        label: copy,
        unit: copy,
        min: z.number(),
        max: z.number(),
        default: z.number(),
        baseYear: z.number(),
      }),
      readingLabel: copy,
      readings: z.array(z.object({ below: z.number(), text: copy })).length(3), // applies while horizon < below
    }),
    z.object({
      ...base,
      template: z.literal('prose'), // contact, donate, curriculum, microsite sub-pages, reports…
      family: z.enum(['institutional', 'reading']).default('institutional'),
      eyebrow: copy.optional(),
      heading: copy.optional(),
      lede: copy.optional(),
      actions: z.array(action).default([]),
      hero: img(image).optional(),
      /** list these publications (by id), or every publication tagged with this programme */
      publications: z.array(z.string()).optional(),
      publicationsFor: z.enum(['grain', 'scans', 'process']).optional(),
      /** render another page's body and form here (e.g. a microsite Contact page reusing /contact) */
      contentFrom: z.string().optional(),
      form: z
        .object({
          fields: z.array(
            z.object({
              name: z.string().regex(/^[a-z]+$/),
              label: copy,
              type: z.enum(['text', 'email', 'tel', 'textarea']),
              required: z.boolean().default(false),
            }),
          ),
          submit: copy,
          success: copy,
        })
        .optional(),
    }),
  ]);

// ── collections ────────────────────────────────────────────────────────────

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: pageSchema,
});

const posts = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      author: z.string(),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      readTime: z.string().optional(),
      cover: img(image).optional(),
      sources,
    }),
});

const publications = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/publications' }),
  schema: ({ image }) =>
    z
      .object({
        order: z.number(),
        title: z.string(),
        type: z.enum(['policy-brief', 'white-paper', 'research-report']),
        summary: z.string(), // Markdown
        authors: copy.optional(),
        date: copy.optional(),
        file: z
          .string()
          .regex(/^\/files\/[a-z0-9-]+\.pdf$/)
          .optional(),
        url: z.url().optional(),
        thumbnail: img(image).optional(),
        programmes: z.array(z.enum(['grain', 'scans', 'process'])).default([]),
        verification: z.object({
          status: z.enum(['verified', 'corrected', 'unverified']),
          note: z.string(),
        }),
        sources,
      })
      .refine((p) => p.file || p.url, 'a publication needs a file or a url'),
});

const team = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      group: z.enum(['team', 'advisor', 'trustee']),
      name: z.string(),
      role: z.string().optional(),
      photo: img(image),
      bio: z.string(), // Markdown
      sources,
    }),
});

const signals = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/signals' }),
  schema: z.object({
    rank: z.number().int().min(1),
    title: z.string(),
    categories: z.array(z.string()).min(1),
    horizon: copy,
    summary: copy,
    sources,
  }),
});

const quotes = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/quotes' }),
  schema: z.object({
    order: z.number(),
    role: z.enum(['expert', 'citizen']),
    roleLabel: copy,
    quote: copy,
    name: copy,
    affiliation: copy,
    portrait: artKey,
    sources,
  }),
});

const navItem = z.object({ label: copy, href });
const settings = defineCollection({
  loader: glob({ pattern: 'site.yaml', base: './src/content/settings' }),
  schema: z.object({
    name: z.string(),
    charityNumber: z.string(),
    charityNumberLabel: copy,
    charityLine: copy,
    email: z.email(),
    phone: z.string(),
    copyright: z.string().includes('{year}'),
    ui: z.object({
      skip: copy,
      home: copy,
      menu: copy,
      mainNav: copy,
      subNav: copy,
      footerNav: copy,
      requested: copy,
      slide: z.string().includes('{n}'),
    }),
    mainNav: z.array(navItem),
    donate: navItem,
    footer: z.array(z.object({ heading: copy.optional(), links: z.array(navItem) })),
    microsites: z.record(
      z.enum(['grain', 'scans', 'process']),
      z.object({ name: copy, subnav: z.array(navItem).min(1), cta: navItem.optional() }),
    ),
    flags: z.object({ teamSection: z.enum(['team', 'experts-citizens']) }),
    sources,
  }),
});

export const collections = { pages, posts, publications, team, signals, quotes, settings };
