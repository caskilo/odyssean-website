# QA report: P8 (2026-10-19)

> Results of the P8 checks on the local build. Reproduce with the commands in [site/README.md](../site/README.md). Gate G2 also needs the placeholder report to be reviewed by Will.

## Summary

| Task | Check | Result |
|------|-------|--------|
| 8.1 | Visual diff of concept pages at 1440px | Every difference explained below |
| 8.2 | Copy parity and design-note blocklist, on the source files **and** on the built HTML | Pass: 151 approved strings found, no design note rendered |
| 8.3 | axe-core (WCAG 2.0 A/AA, 2.1 A/AA, 2.2 AA, including colour contrast) on all 33 pages at 360 and 1440px | Pass: 0 violations |
| 8.3 | Keyboard: skip link first, visible focus on every stop, no trap, slider/selector/menu operable | Pass |
| 8.3 | Lighthouse, mobile profile, 12 representative pages | Pass: accessibility, best practices and SEO are 100 everywhere; performance 96 to 99 |
| 8.4 | Titles, descriptions, canonicals, Open Graph, heading order, image alt text, sitemap, noindex | Pass, see below |
| 8.4 | `/blog-feed.xml`, `robots.txt` | Added |
| 8.5 | Redirects replayed against the generated `.htaccess` | Pass: 106 URLs, 70 redirected, none lost or looping |
| 8.6 | Internal links and anchors | Pass: 1,551 references |
| 8.6 | External links | Reported, not fixed: [link-report.md](link-report.md) |

## What the checks found and fixed

| Finding | Fix |
|---------|-----|
| Canonical and Open Graph URLs ended in `.html`, and the current page was never highlighted in the navigation of the built site (Astro builds pages as files) | `Base.astro` now derives the public path |
| Heading order jumped (h1 to h3) on the publication lists, the blog index, the team list and one blog post | `RegisterRow` takes a heading level; team names follow their group heading; the post's `###` headings became `##` |
| Two GRAIN pages had no description | Drafted, pending approval ([open-questions.md](new-design/open-questions.md) section 2) |
| The pending-content label failed colour contrast | Removed its transparency |
| Home page carousel dots were smaller than the 24px WCAG 2.2 minimum | 24px hit areas (44px on phones), layout unchanged |
| Pages with no `noindex` support except one template | `noindex` is now part of the `prose` template only |
| The contact form posts to a handler that does not exist yet | Form switched off (`flags.contactForm`); the page shows the email address and phone number |
| Slow first paint and layout shift on the Modelling page (performance 84) | The four fonts used on first paint are preloaded (now 99) |
| Content Security Policy would have needed inline scripts | Scripts are never inlined (`assetsInlineLimit: 0`), so the policy can forbid them |

## 8.1 Visual differences from the concept (1440px)

The percentage is the share of pixels that differ from the slide image. Small shifts of text move many pixels, so the number mostly measures offsets. In every case the hero or first screen matches the concept in layout, colour and type.

| Page | Diff | Why it differs |
|------|-----:|----------------|
| Home | 0.2% | Matches |
| Projects | 12.7% | The design notes in the slide ("Room 1 · Current work", "3 panels", "Archive") are deliberately not built, so the heading and panels sit a little differently |
| Publications | 3.6% | Real register entries replace the slide's sample rows |
| About | 10.7% | The slide shows only "Why we are Odyssean". The site adds the page heading and the introduction placeholder (CR-001) above it |
| About, Experts and Citizens (preview) | 20.9% | The slide's sample quotes are replaced by pending-content labels (CR-009), and the real header shifts the section down |
| GRAIN | 9.8% | The real navigation replaces the slide's, and the live GRAIN article continues below the first screen |
| Horizon Scans | 11.4% | The slide's `[Key issue title]` placeholders are replaced by the real top-five signals, and the card shows the real summary |
| Odyssean Process | 4.4% | Real header and footer |
| Modelling | 3.1% | Real header and footer |

## 8.4 Metadata and structure

Every page has a title, language, canonical address, Open Graph title, exactly one h1 and no skipped heading levels. Every page that search engines may show has a description. Posts without one use the first paragraph of the post, cut at a sentence. Posts add the article type, publication date and cover image. The previews, the 404 page and the thank-you page are `noindex` and left out of the sitemap. A link to the feed is in every page's head.

Every page also has a link-preview image: the gold logo on dark blue (`public/og-default.png`, made by `tools/brand/og-image.mjs`), or the cover picture on blog posts.

## Still to do on the real server (P9)

The redirect check is a simulation of the Apache rules. Re-run the same URLs on the staging host (9.4), together with the security headers, the 404 page and the contact form.
