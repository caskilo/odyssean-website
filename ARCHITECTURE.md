# Architecture

How the site is put together, and why. For the plan and page list see `design-docs/build-plan.md` (local only); for editing content see [`CONTENT.md`](CONTENT.md).

## In one paragraph

A static [Astro](https://astro.build) site. Every word lives in `src/content/` (Markdown and YAML) and is validated by schemas, so a bad edit fails the build instead of shipping. Views turn content into pages, components and CSS tokens give each of the four strands (Info, GRAIN, Horizon Scans, Odyssean Process) its own look, and a few small scripts enhance pages that already work without JavaScript. The build produces plain files plus an Apache `.htaccess`.

## Principles

1. **No copy in code.** Templates, components and scripts hold no sentences. Missing text is a typed _content request_ (`{ request: CR-###, note }`) that renders as a visible placeholder and is tracked in [`open-questions.md`](docs/open-questions.md).
2. **Every page works without JavaScript.** Scripts only add behaviour on top (publications filter, signal selector, time-horizon slider).
3. **The slides are ground truth.** Concept pages are checked against the design images. Where the concept is silent, the closest slide component is extended.
4. **Static and boring.** No server code, no runtime dependencies beyond Astro, no cookies, no analytics.

## Data flow

```text
src/content/**  ──schema (content.config.ts)──▶  getCollection / getEntry
                                                        │
        pages/[...slug].astro  ── data.template ──▶  views/<Template>.astro
                                                        │
                      layouts/<Strand>.astro ─▶ layouts/Base.astro (head, header, footer, theme)
                                                        │
                                     components/core/*  +  art/<key>/Art.astro
                                                        ▼
                                                 dist/*.html  (+ dist/.htaccess)
```

- **Routing.** `pages/[...slug].astro` makes one route per file in `content/pages/`; the file path is the URL (`pages/grain/reports.md` is `/grain/reports`). It picks a view from a lookup table keyed on the page's `template`. Blog posts, the RSS feed (`/blog-feed.xml`) and the noindex previews have their own route files. Output is one file per page (`about.html`) and Apache serves it as `/about`.
- **Templates.** A page's front matter says which template it uses (`home`, `projects`, `publications`, `about`, `focus`, `faq`, `blog`, `grain-landing`, `scans-landing`, `process-landing`, `modelling`, or the general-purpose `prose`). Each template has its own schema in `content.config.ts`, so the fields a page may use are checked.
- **Shared lists** (team, publications, signals, quotes) are collections, queried through helpers in `lib/content.ts`.
- **Site-wide settings** (name, navigation, footer, microsite sub-navs, feature flags) are in `content/settings/site.yaml`.
- **One header everywhere.** A strip above the logo lists the three projects (left) and FAQ and Contact (right); the main row shows the section's links (the info sections, or the current project's sub-nav) and Donate. On phones, one menu holds the same groups in the same order. `lib/site.ts` marks the current page and its section in each group.

## Layers

| Layer      | Where                  | Notes                                                                                                                                                                                                                                                    |
| ---------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Views      | `src/views/`           | One per template. Fetch related content, compose components, own page-specific CSS.                                                                                                                                                                      |
| Layouts    | `src/layouts/`         | `Base` writes `<head>` (title, description, canonical, Open Graph, font preloads), the header, footer and `data-theme`. The others are thin: they choose the strand and, for Reading, the page width.                                                    |
| Components | `src/components/core/` | Shared pieces taken from the slides: Logo, Header, Menu, Footer, Headline, Eyebrow, Button, Card, RegisterRow, Pill, RomanSection, Prose, PageTitle, Mark. `Copy` renders text or a content-request placeholder.                                         |
| Art        | `src/art/<key>/`       | `Art.astro` (SVG) and `meta.json` (`status`: final or placeholder; `mobile`: scales, interim or final). Views look art up by key through `lib/art.ts`, so replacing a graphic means replacing one folder. `npm run report:placeholders` lists stand-ins. |
| Styles     | `src/styles/`          | `tokens.css` (colours, type scale, spacing), four theme files, `base.css`. Components use semantic tokens only (`--bg`, `--fg`, `--accent`, `--surface`, `--rule`, `--btn-*`).                                                                           |
| Scripts    | `src/scripts/`         | Four small TypeScript files, each bound by `data-*` attributes. `lib/fan.ts` holds the fan-chart geometry used by both the server render and the slider, so the no-JavaScript state equals the default JavaScript state.                                 |

### Themes

The strand sets `data-theme` on `<body>` (`info`, `grain`, `scans`, `process`). The Modelling page adds `data-variant="dark"`. Each theme file only sets the semantic tokens, which is why components do not know which strand they are in. GRAIN adds a faint mesh texture on `body[data-theme='grain']`.

### Responsive behaviour

Layouts use flexbox and fluid sizes (`clamp()`), with a few breakpoints at 40rem, 48rem and 64rem. At 48rem and below: body type rises to 16px (`--step-small`), stand-alone links get at least 44px tap height (`.tap`, button minimum), and charts enlarge or drop small labels (marked `mobile: interim`). `npm run verify:responsive` enforces this on every page.

## Content model

| Folder                         | Holds                                                                       |
| ------------------------------ | --------------------------------------------------------------------------- |
| `pages/`                       | One file per page (`template:` decides the fields)                          |
| `posts/`                       | Blog posts; the file name is the URL slug and old Wix URLs are kept exactly |
| `publications/`                | The publications register, each entry tied to one verified PDF              |
| `team/`, `signals/`, `quotes/` | Shared lists                                                                |
| `settings/site.yaml`           | Organisation details, navigation, footer, feature flags                     |

Feature flags in `site.yaml`: `teamSection` (`team` or `experts-citizens`, for the 2027 swap) and `contactForm` (off until the mail handler exists on the host). Every entry records where its content came from in `sources`.

## Build and hosting

`npm run build` runs `astro build` and then `tools/redirects/htaccess.mjs`, which writes `dist/.htaccess`:

- clean URLs (`/about` serves `about.html`), no trailing slashes, canonical host;
- 301 redirects from the old Wix URLs, including the externally cited PDFs, generated from [`tools/redirects/legacy.json`](tools/redirects/legacy.json);
- security headers (including a Content-Security-Policy that allows no inline scripts, which is why `vite.build.assetsInlineLimit` is 0 so Astro never inlines one) and caching rules (hashed `_astro/` files are immutable);
- a branded 404 page (`content/pages/404.md`).

Publishing from GitHub to Mythic Beasts (SFTP) is described in [`DEPLOYMENT.md`](DEPLOYMENT.md).

Other generated files: `sitemap-index.xml` (previews, the thank-you page and 404 are excluded), `blog-feed.xml`, and `robots.txt` from `public/`.

## Checks

Three layers, from cheapest to most thorough:

1. **Schemas and types** (`astro check`, the build): content shape, templates, props.
2. **Rules a schema cannot express** (`verify:content`, `verify:built`, `verify:redirects`, `verify:links`): approved concept copy present and design notes absent in both the source and the rendered HTML; every page has a title, description, canonical and sensible headings; every old URL ends on a real page; every internal link and anchor resolves. These need no browser and run in CI.
3. **Browser checks** (`verify:behaviour`, `verify:responsive`, `verify:a11y`, `verify:lighthouse`, `verify:visual`): run locally with Chrome or Edge. They share `tools/verify/_env.mjs` (serves `dist/` on 127.0.0.1 and finds the browser) and `_concept.mjs` (the approved concept strings and the design-note blocklist).

## Decisions worth knowing

- **One view per template, no shared intro component.** The three microsite landings repeat a small intro block on purpose; they differ in alignment and colour and are easier to read independently.
- **Custom properties instead of `:global` overrides.** Views tune child components with CSS variables (`--eyebrow-gap`, `--heading-wrap`) rather than reaching into their class names.
- **`entry as never` in the router.** The schema is the real check; TypeScript cannot narrow through a lookup table.
- **Fonts are self-hosted** (Arrus BT, Instrument Sans, DM Mono) and the four used on first paint are preloaded.
- **No analytics** at launch, so no cookie banner.
- **Contact form.** The form component exists but is switched off; the page shows the email address and phone number until the mail handler is built (build-plan 9.3).

Longer reasoning and the agreed architecture decisions (AD1 to AD12) are in build-plan Part C; a human-review checklist is in `design-docs/code-review-guide.md` (both local only).
