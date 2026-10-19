# Code review guide

> **Status:** written after P7 (2026-10-18), for a human-led review of the Astro site in `site/`.
> **Scope:** `site/src`, `site/tools`, CI. Not the content itself (see [content-map.md](content-map.md)) or the Wix extraction scripts.
> **Rules being checked against:** [build-plan.md](build-plan.md) Part E (hard rules, definition of done) and [CONTENT.md](../site/CONTENT.md).

---

## 1. Before you start (5 minutes)

```bash
cd site
npm ci
npm run check && npm run verify:content && npm run format:check   # what CI runs
npm run build
npm run verify:behaviour      # needs Chrome/Edge (set CHROME_PATH if not found)
npm run verify:responsive     # every route × 360/768/1024/1440
npm run verify:visual         # side-by-side PNGs vs the concept, in test-results/visual/
npm run report:placeholders   # art that is still a stand-in or mobile: interim
```

CI (`.github/workflows/ci.yml`) runs only the first group plus `report:placeholders`. The three browser checks are **local only** for now. Whether to bring them into CI (Playwright install step) is open (see section 6).

## 2. Map of the code

| Area | Where | Size | What to know |
|------|-------|------|--------------|
| Content model | `src/content.config.ts`, `src/content/**` | schemas + 72 files | One Zod schema per page `template`, discriminated union. Copy is `string \| {request, note}` (a *content request*) |
| Routing | `src/pages/[...slug].astro`, `src/pages/post/[slug].astro`, `src/pages/preview/*` | 4 files | The catch-all maps `data.template` to a view through one lookup table. Preview routes are `noindex` |
| Views | `src/views/*.astro` | 12, ~1.9k lines | One per template. Each reads its page entry and composes components. **No copy lives here** |
| Layouts | `src/layouts/*.astro` | 7 | `Base` holds `<head>`, header, footer and sets `data-theme`. The other six are thin wrappers that pick the strand |
| Components | `src/components/core/*` (shared), `components/process/FanChart`, `ContactForm`, `ExpertsCitizens` | 18 | Core components match the slide components. Each has scoped CSS |
| Art registry | `src/art/<key>/{Art.astro,meta.json}`, `src/lib/art.ts` | 14 entries | Looked up by key. `meta.json` records `status` and `mobile`. Views never import art directly |
| Styling | `src/styles/{tokens,base,fonts}.css`, `themes/*.css` | ~300 lines | Tokens, then four theme layers keyed on `body[data-theme]`. Component CSS is scoped and uses only semantic tokens (`--bg`, `--accent`, `--surface` …) |
| Client JS | `src/scripts/{carousel,filter,signals,fan}.ts` | ~100 lines | Progressive enhancement only (see 3.3). `lib/fan.ts` is shared with the server render |
| Tooling | `tools/verify/*`, `tools/report/*`, `tools/extract/*` | | `verify:*` are Playwright-based. `extract/` was run once (CONTENT.md) |

Request path for a page: `content/pages/x.md` → schema validates → `[...slug].astro` picks view → view fetches related collections via `lib/content.ts` → layout (`Base`) → static HTML.

## 3. What to look at, and why

### 3.1 Contracts that must hold (hard rules, E.2)

| Rule | How to check |
|------|--------------|
| No copy in components | `grep` for string literals in `src/views` and `src/components`. Expected exceptions: ARIA fallbacks, units, art-internal glyphs (`I II III`, `N`, compass), the `Fig.` captions come from content. The fan chart's accessible title is composed from the headline fields |
| Pages work without JS | `verify:behaviour` covers carousel, filter, signals, slider. Also disable JS in the browser and walk one page per strand |
| Every placeholder is registered | `report:placeholders` |
| Dependencies pinned, ≥7 days old | `package.json` (exact versions) |
| Design notes never shipped | Blocklist check is planned for P8 (8.2), **not built yet** |

### 3.2 Decisions made while building (P3–P7) that you may want to overrule

| Decision | Where | Reason |
|----------|-------|--------|
| Catch-all route uses a single `entry as never` cast | `pages/[...slug].astro` | `PageOf<K>` narrowing does not flow through a lookup table. The check is the schema, not the type |
| `prose` template serves most non-concept pages incl. all GRAIN sub-pages, Expert Elicitation, Deliberation | `views/ProsePage.astro` | Plan 4.3 / 6.4 say "extend slide components". We reused Institutional/Reading components rather than build bespoke layouts |
| Landing views duplicate a small intro block (eyebrow + headline + aside) | `ScansLanding`, `ProcessLanding`, `Modelling` | The three are close but differ in alignment and colour. **Candidate for a shared `MicrositeIntro` component**; left until the design decisions after P7 |
| Fan geometry in `lib/fan.ts`, used by server and client | `lib/fan.ts`, `scripts/fan.ts`, `FanChart.astro` | Ensures the no-JS default equals the JS-computed state |
| Signal selector: all cards in the DOM, JS hides all but one | `ScansLanding`, `scripts/signals.ts` | No-JS fallback is a list; selector buttons only appear with JS |
| `--step-small` rises to 1rem at ≤768px (all other sizes unchanged) | `styles/tokens.css` | Plan 7.1: body type ≥16px on phones. Desktop keeps the concept's 15px |
| `.tap` utility for stand-alone text links | `styles/base.css` | Padding + negative margin gives ≥44px tap height without shifting layout |
| Hero dots become 44px hit areas on phones; bars drawn with `::after` | `views/Home.astro` | Desktop look is unchanged |
| Microsite SVG art uses `@media` inside the SVG component to enlarge labels or drop decoration on phones; marked `mobile: interim` | `art/voyage-chart`, `art/signal-tracks`, `FanChart` | Plan 7.1 allows interim simplification. Real phone-specific art is later |
| Sub-nav "current" = longest matching href | `lib/site.ts` `currentHref` | Previously "Overview" matched every sub-page |

### 3.3 Things I would look at hardest

1. **`content.config.ts`**: the schema is the product's safety net. Check that every template field is used and every used field exists. Known unused: signal `categories` is validated but not shown (the concept does not display them). Keep, show, or drop?
2. **`views/ProsePage.astro`**: the busiest view (layout switching, `contentFrom`, publication lists, form). Check the `contentFrom` path and the `as PageOf<'prose'>['data']` cast.
3. **Scoped-CSS leaks via `:global`**: several views style children of core components (`.intro :global(h1)`, `.hero__text :global(.eyebrow)`). Convenient but couples the view to component class names. Consider props/slots instead.
4. **Art components with inline `<style>` media queries**: confirm they behave in both browsers' SVG engines (`r` and `translate` as CSS properties on SVG elements: works in current Chrome, Firefox and Safari).
5. **`scripts/*.ts`**: small, but check listeners for double-binding if the pages are ever navigated client-side (they are not now: no view transitions).
6. **Accessibility semantics**: `aria-current` vs `aria-pressed` choices (filter links use `aria-current`, signals use `aria-pressed`, per plan). `aria-live` on the Modelling reading. Alt text gaps (CR-003, 2 images).

### 3.4 Known gaps (not defects)

| Gap | Planned for |
|-----|-------------|
| No copy-parity or design-note blocklist script | P8 (8.2) |
| No axe / Lighthouse run, no keyboard walk-through beyond the behaviour checks | P8 (8.3) |
| `/blog-feed.xml`, canonicals review, per-page OG images, `robots.txt` | P8 (8.4) |
| `.htaccess` redirects from `tools/redirects/legacy.json` | P8 (8.5) |
| Contact form handler is UI only | P9 (AD10) |
| Placeholders: `hero-mountains`, `hero-sea`; interim mobile: `voyage-chart`, `signal-tracks` | Design |
| Content requests still open: CR-001, 002, 004–009 | Content |
| Loader mark (`Mark spin`) is built but only used in the gallery | Remove if no page needs it |

## 4. What the automated checks do and do not prove

| Check | Proves | Does not prove |
|-------|--------|----------------|
| `check` / `build` | Types and templates compile. Schemas validate all content | Visual correctness |
| `verify:content` | Concept strings present, requests registered | Anything about layout |
| `verify:behaviour` | JS and no-JS states of carousel, filter, signals, slider, menu, FAQ, form message | Screen-reader behaviour |
| `verify:responsive` | At every route and width: no horizontal scroll. At ≤768px: stand-alone targets ≥44px, non-mono body text ≥16px | Line-length, spacing quality, that things *look* right. Inline links in running text and mono labels/captions are exempt by design |
| `verify:visual` | Produces concept-vs-site PNG pairs and a mismatch %. 1440 only | A pass/fail. The percentages include real nav and footer, which differ from the slides on purpose |

## 5. Suggested review order (about 90 minutes)

1. `content.config.ts` and one content file per template (15 min).
2. `layouts/Base.astro`, `lib/site.ts`, `core/Header.astro`, `core/Menu.astro` (10 min).
3. `pages/[...slug].astro`, then the three microsite landings and `Modelling` (20 min).
4. `styles/` and one theme's worth of component CSS (15 min).
5. `scripts/` and `lib/fan.ts` (10 min).
6. `tools/verify/*` and CI (10 min).
7. Run section 1, then open `test-results/visual/*.png` for the concept pages (10 min).

## 6. Questions for the review

1. Bring `verify:behaviour` and `verify:responsive` into CI (needs a browser install step, about 1 minute)?
2. Extract a shared `MicrositeIntro` and a shared "numbered cell row" (used by GRAIN pillars and Process ports), or keep views independent?
3. Replace `:global` overrides with props on `Eyebrow`/`Headline`?
4. Show, keep silent, or drop signal `categories`?
5. Are phone-width simplifications of the three charts good enough to show at G2, or should phone art come earlier than planned?
6. Is the `--step-small` 15 → 16px change on phones acceptable, or should it apply to all widths?

---

## 7. Review outcome (2026-10-19)

Section 1 was run by Will (all checks pass). Sections 2 to 5 were reviewed by Devin against [build-plan.md](build-plan.md) Part E. After the changes below, `format:check`, `check`, `build`, `verify:content`, `verify:behaviour` and `verify:responsive` pass, and `verify:visual` mismatch percentages are unchanged.

### 7.1 Answers to section 6

| # | Question | Answer |
|---|----------|--------|
| 1 | Browser checks in CI | No install step for now |
| 2 | Shared `MicrositeIntro` / numbered-cell row | No. Keep views independent |
| 3 | Replace `:global` overrides | Done, see 7.2 (custom properties, not props) |
| 4 | Signal `categories` | Keep, not shown |
| 5 | Phone-width chart simplifications | Good enough for now |
| 6 | `--step-small` 16px on phones | Accepted |

### 7.2 Changes made

| Change | Where | Why |
|--------|-------|-----|
| `:global` overrides replaced by custom properties: `--eyebrow-gap` (`Eyebrow`), `--heading-wrap` (`h1`-`h4` in `base.css`), new `Headline` size `landing`, `--accent` on the Home hero | Home, About, ProsePage, Modelling, GrainLanding, ScansLanding, ProcessLanding, `ExpertsCitizens`, `Eyebrow`, `Headline`, `base.css` | Views no longer depend on child class names. Two overrides were redundant and were deleted. `Prose` and `RegisterRow` keep `:global` for rendered Markdown |
| Post cover alt uses `text(alt) ?? ''` | `pages/post/[slug].astro` | `as string` would render `[object Object]` for a pending content request (CR-003) |
| `/donation-thank-you-page` excluded from the sitemap | `astro.config.mjs` | The page is `noindex` |
| `contentFrom` resolved with `getPage(id, 'prose')` | `ProsePage` | Validates the template and removes a cast |
| `publicationHref`, `publicationMeta` helpers | `lib/content.ts`, `Publications`, `ProsePage` | Removed duplication and a `!` assertion |
| Carousel announces slide changes only on user action | `scripts/carousel.ts` | Auto-rotation spammed the `aria-live` region |
| Removed `decodeURIComponent` from the filter hash | `scripts/filter.ts` | A malformed hash threw. Filter ids are ASCII slugs |

### 7.3 Open findings (for implementation)

**Before staging or launch**

| Finding | Detail | Suggested action |
|---------|--------|------------------|
| Contact form posts to a missing `/contact.php` | `ContactForm.astro` is in the build, so submitting on a static host fails | Hide the form, or show the email address, until P9 |
| `legacy.json` contains identity mappings | `/blog-feed.xml` maps to itself (redirect loop if emitted) and `/projects` maps to `/projects` | The P8.5 `.htaccess` generator must skip entries where source equals target |
| No `public/.htaccess` or `robots.txt` | Planned P8 (8.4, 8.5) | Add with security headers: CSP, `X-Content-Type-Options`, `Referrer-Policy`, cache rules |
| `noindex` is only honoured by `ProsePage` | The base schema allows it on every template | Pass it through in every view, or move it to the `prose` schema |

**Lower priority**

| Finding | Detail |
|---------|--------|
| Fonts | Arrus BT ships as four `.otf` files (about 200 KB). AD7 says subset WOFF2, which would save about 40%. No preload |
| Carousel | Auto-rotates with no pause button (pauses on hover/focus, honours reduced motion). The art is decorative, so likely acceptable, but WCAG 2.2.2 audits may flag it |
| `verify:content` scope | It checks the design-note blocklist against `src/content` only, not built HTML. The guide's 3.1 and 3.4 say the blocklist is not built, but it is |
| Footer year | Computed at build time, so it changes only on rebuild |
| Focus details | Looked up by heading string. Brittle, but covered by `verify:content` |
| Known gaps from 3.4 | Still apply: axe/Lighthouse, OG images and per-page meta, `/blog-feed.xml`, `.htaccess` redirects, form handler |

### 7.4 Checked and fine

- Security: every `set:html` source is the project's own Markdown or YAML. No scripts, iframes or inline handlers in content. No secrets. No `target="_blank"`. Dependencies are pinned exactly. `npm audit` reports 0 vulnerabilities.
- The single `entry as never` cast in `[...slug].astro` is acceptable because the schema is the real check.
- Client scripts are small and do not double-bind (no client-side navigation).
- SVG ids in `art/origin-venn` are fixed, which is safe because it appears once per page.

---

## 8. Follow-up after P8 (2026-10-19)

How the open findings in 7.3 and the known gaps in 3.4 stand now. Results of the P8 checks are in [qa-report.md](qa-report.md).

| Finding | Status |
|---------|--------|
| Contact form posts to a missing `/contact.php` | Done. `flags.contactForm` is off; the page shows the email address and phone number. Switch it on in P9 |
| `legacy.json` identity mappings | Done. The generator skips entries where source equals target (`/projects`, `/blog-feed.xml`) |
| No `.htaccess` or `robots.txt` | Done. `dist/.htaccess` is generated at build (clean URLs, redirects, security headers incl. a Content-Security-Policy, caching, 404 page); `robots.txt` is in `public/` |
| `noindex` only honoured by `ProsePage` | Done. The field now exists only on the `prose` template, which is the only one that uses it |
| Fonts: no preload | Done for the four fonts used on first paint (it also fixed a layout shift on Modelling). Subsetting Arrus BT to WOFF2 is still open |
| Carousel has no pause button | Open (pauses on hover and focus, honours reduced motion; axe passes) |
| `verify:content` checks only the source | Done. `verify:built` repeats copy parity and the design-note blocklist on the rendered HTML |
| Footer year changes only on rebuild | Open, acceptable |
| Focus details looked up by heading text | Open, still covered by `verify:content` |
| Gaps in 3.4: copy parity, axe/Lighthouse, feed, canonicals, robots, redirects | Done. Open Graph images done (gold logo on dark blue; posts use their cover) |

CI now also runs `verify:built`, `verify:redirects` and `verify:links` (none needs a browser). The browser checks stay local.
