# Open questions & content requests

> Live doc. Answered items are removed. Context: [build-plan.md](../build-plan.md) · [content-map.md](../content-map.md) (generated; shows where each request is used).
> **Nothing here blocks the build.** Each item has a default or a visible placeholder until it's answered. Request IDs (CR-###) are used inside the content files; `npm run verify:content` fails if an ID used there is missing from this page.

## Content requests (for Giuseppe)

Grouped by when they're needed. Under the content rule, we only move existing content; each of these is a gap the current site can't fill.

### Needed for launch

| ID | Page | What's needed | Default until answered |
|----|------|---------------|------------------------|
| **CR-001** | `/about` | **Splash text introducing the institute** (was open question C5). The current site has none; the old `/services-1` draft holds placeholder copy. | Visible placeholder above "Why we are Odyssean" and the Team |
| **CR-002** | `/donation-thank-you-page` | **A short static thank-you message.** The live page uses Wix donation placeholders ("Thank you, Donor Name … £0 … #1000") that a static site can't fill. | Placeholder; the page stays `noindex` |
| **CR-003** | Blog posts, Donate, GRAIN report | **Alt text for 16 images** that have none on the live site, mostly event photos in the 2024 and 2025 reviews and the Odyssey Launched post. Run `npm run verify:content -- --list-alt` for the list. | Treated as decorative (empty alt) |
| **CR-004** | `/grain` | The concept's **"Policy brief, Feb 2026"** button. That document isn't on the current site. Please send the PDF, or confirm we drop the button. | Button shown as pending, no link |
| **CR-005** | `/grain/collaborate` | **Content for the GRAIN "Collaborate" page** (the concept's call to action). No current page matches it. | Page with heading and placeholder |
| **CR-006** | `/horizon-scans` | **A time horizon for each of the 5 signals.** The Horizon Scan paper doesn't give one per issue. | The "· [time horizon]" slot is hidden |
| **CR-007** | `/publications` | **Missing authors or dates** for: Governance Under Fallout (date) · Bridging local & technocratic epistemologies (date) · Policy Robustness & Uncertainty (date) · Odyssean Process Policy Brief (authors) · A Master Equation for Power Laws (authors, date). | Field left out of the register row |
| **CR-008** | 11 new pages | **Meta descriptions** (the text shown in search results) for pages that didn't exist before: Projects, Blog, all three microsite landings and their sub-pages. | No meta description (search engines generate a snippet) |

### Not needed for launch

| ID | Page | What's needed | Notes |
|----|------|---------------|-------|
| CR-009 | `/about` (Experts & Citizens) | **4 quotes with names and affiliations** for the future Team section (concept 08). | The section ships switched off (`flags.teamSection`); due with the Assembly (~2027) |

## For information (no action needed)

- **The live Publications page links some entries to the wrong PDF.** On 5 of the 10 entries, the title, thumbnail, "Read All" button or links in the summary point to a different document. The new site uses the correct file for each entry; details are in [content-map.md § Publications](../content-map.md). Worth fixing on Wix only if the site stays up for a while.
- **There are two editions of the White Paper** (2023 and 2024). The new site features the 2024 edition. The old 2023 URL still serves the 2023 file.
