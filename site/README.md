# Odyssean Institute website

A static rebuild of [odysseaninstitute.org](https://www.odysseaninstitute.org), built with [Astro](https://astro.build). Content lives in Markdown and YAML files, the site builds to plain HTML, and it is served from Apache on Mythic Beasts.

|                  |                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Plan**         | [`../docs/build-plan.md`](../docs/build-plan.md): scope, page register, phases and gates                                  |
| **Editing**      | [`CONTENT.md`](CONTENT.md): how to change words, add posts and publications (also written for an LLM assistant)           |
| **How it works** | [`ARCHITECTURE.md`](ARCHITECTURE.md)                                                                                      |
| **Open items**   | [`../docs/new-design/open-questions.md`](../docs/new-design/open-questions.md): what we are waiting on from the institute |

## Quick start

Requires Node 22.12 or newer.

```bash
npm ci
npm run dev        # http://localhost:4321, live reload
npm run build      # static site and Apache config in dist/
npm run preview    # serve dist/ locally
```

## Before you commit

```bash
npm run format         # Prettier
npm run check          # type and template check
npm run verify:content # content rules (see CONTENT.md)
```

CI runs the same checks plus the built-site checks below on every push and pull request.

## Scripts

| Script                      | What it does                                                                               | Needs                |
| --------------------------- | ------------------------------------------------------------------------------------------ | -------------------- |
| `dev` / `build` / `preview` | Astro. `build` also writes `dist/.htaccess` (redirects, headers, caching)                  |                      |
| `check`                     | `astro check`: types, templates and content schemas                                        |                      |
| `format` / `format:check`   | Prettier                                                                                   |                      |
| `verify:content`            | Concept copy present, design notes absent, content requests registered, links resolve      |                      |
| `verify:built`              | Built HTML: copy parity, design notes, titles, descriptions, canonicals, headings, sitemap | `build`              |
| `verify:redirects`          | Replays `dist/.htaccess` against every old URL and page                                    | `build`              |
| `verify:links`              | Internal links and anchors. Add `-- --external` to test outside links (report only)        | `build`              |
| `verify:behaviour`          | Interactive pieces, with and without JavaScript                                            | `build`, Chrome/Edge |
| `verify:responsive`         | Every page at 360 / 768 / 1024 / 1440: no sideways scroll, tap targets, text size          | `build`, Chrome/Edge |
| `verify:a11y`               | axe-core (WCAG 2.2 AA) on every page, plus keyboard checks                                 | `build`, Chrome/Edge |
| `verify:lighthouse`         | Lighthouse (mobile): every category must score 90 or more                                  | `build`, Chrome/Edge |
| `verify:visual`, `shots`    | Concept-versus-site comparison images and full-page screenshots, in `test-results/`        | `build`, Chrome/Edge |
| `report:placeholders`       | Lists art that is still a stand-in or only an interim phone version                        |                      |
| `report:content-map`        | Regenerates [`../docs/content-map.md`](../docs/content-map.md)                             |                      |

The browser checks find Chrome or Edge automatically. Set `CHROME_PATH` if yours is somewhere unusual. On Git Bash for Windows, pass routes without a leading slash (`npm run shots -- about`), or the shell rewrites them into file paths.

## Repository layout

```text
site/
├─ src/
│  ├─ content/        every word on the site (Markdown and YAML), checked by schemas
│  ├─ content.config.ts  the schemas
│  ├─ pages/          routes (one catch-all for content pages, plus posts, feed and previews)
│  ├─ views/          one view per page template
│  ├─ layouts/        page shells (Base plus one per strand)
│  ├─ components/     shared building blocks
│  ├─ art/            swappable graphics, one folder each
│  ├─ styles/         design tokens and the four themes
│  ├─ scripts/        small enhancements (filter, signal selector, slider)
│  ├─ lib/            helpers
│  └─ assets/         images and fonts
├─ public/            files copied as they are: PDFs, favicon, robots.txt
├─ tools/             checks, reports, redirects and the one-off Wix extraction scripts
└─ dist/              build output (not committed)
```

## Deployment

Not live yet. The plan is GitHub Actions building the site and copying `dist/` to Mythic Beasts with `rsync` (build-plan P9). Until then, CI only builds and checks. `dist/.htaccess` is generated from [`tools/redirects/legacy.json`](tools/redirects/legacy.json), so old Wix links keep working.
