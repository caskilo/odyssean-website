# Website Concepts: extracted

> **Source:** `../Odyssean Institute — Website Concepts.html` (and `.pdf`) · extracted 2026-10-09
> **What's here:** the 10 concept slides unpacked into standalone files, plus screenshots and the verbatim text.
> **Status:** This is a reference for the design and layout. **It is not site copy.** See [Content rule](#content-rule).

---

## Contents

| Path | What |
|------|------|
| `slides/NN-name.html` | Each slide as a standalone page. Open it in a browser and it renders (React loads from jsDelivr, so you need to be online). Fonts and SVGs are embedded. |
| `screenshots/NN-name.png` | Headless Chrome render at 1440 px wide. Matches the PDF. |
| [`slides-text.md`](slides-text.md) | Verbatim rendered text per slide, in DOM order, with any real (non-`#`) links |

## Slide index and site position

| # | Concept title | File stem | Strand | Position in the flow |
|---|---------------|-----------|--------|----------------------|
| 2 | A horizon that dawns | `02-home` | Info | **Homepage** (`/`). Treat as near-final and copy it closely |
| 7 | The mark as a navigating dial | `07-home-focus-dial` | Info | **Content** for `/focus`, plus mark uses (favicon etc.). The dial itself is backlog |
| 6 | The library register | `06-publications` | Info | `/publications`; sets the Reading family |
| 5 | Projects as exhibition panels | `05-projects` | Info | `/projects`, leading into the three microsites |
| 10 | Gell-Mann's Odyssean education | `10-origin-of-name` | Info | `/about`: the "Why we are Odyssean" section; sets the Institutional family |
| 8 | Experts and citizens side by side | `08-experts-citizens` | Info | `/about`: **future Team section** (~2027), built now behind a flag |
| 1 | GRAIN: the network that reroutes | `01-grain` | GRAIN microsite | `/grain` |
| 3 | Signals as particle tracks | `03-horizon-scan` | Horizon Scans microsite | `/horizon-scans` |
| 4 | The process as a voyage chart | `04-odyssean-process` | Odyssean Process microsite | `/odyssean-process` |
| 9 | A fan of futures | `09-fan-of-futures` | Odyssean Process microsite | `/odyssean-process/modelling` (DMDU) |

Full site map: [build-plan.md B.1](../../build-plan.md#b1-site-map).

**Structural rules (agreed):**

- **The info strand has the main nav.** Each of the **three microsites** (GRAIN, Horizon Scans, Odyssean Process) has its own sub-nav and its own look, because each serves a slightly different audience.
- The microsites **don't share a template**; they share core components, with a different theme each (build-plan C.3).
- The **"Odyssean Institute" logo is a button back to the homepage** on every page, programme pages included.
- GRAIN's sub-nav items (1) are **separate pages**.
- Where the concept doesn't define something, **extend it using the concept's own components**.

## What the concepts contain: design notes vs site elements

We learn from the design notes but **don't ship them**:

| Slide | Element | Treatment |
|-------|---------|-----------|
| All | Slide titles (e.g. "Projects as exhibition panels") | Design note |
| 5 | ~~"Each panel opens a full project page in the same format"~~ | **Removed** from `slides/05-projects.html` and its screenshot. It contradicts the agreed structure |
| 7 | "The same mark at every scale · Favicon · Loader · Section marker · Footer lockup" | Design note. **Do build** the uses it lists (favicon, loader, section marker, footer lockup) |
| 7 | Breadcrumb "Homepage · Focus areas" | Design label; tells us where the section belongs |
| 5 | "Room 1 — Current work · 3 panels" | Design note |
| 5 | "Archive →" | Design note |

**Interactive behaviour shown in the concepts:**

| Slide | Behaviour | What the concept shows |
|-------|-----------|------------------------|
| 2 | Hero carousel ("01 / 03") | Only the first of three states |
| 3 | Pick one of five signals; its track lights up and a detail card opens | All states, but the content is placeholder |
| 7 | Three-way dial and tabs (Institutions / Resilience / Wellbeing) | All three tabs |
| 6 | Filter by type | Filter list only; no filtered state shown |
| 9 | Time-horizon slider (4–50 years) reshapes the fan and changes the reading | All three readings (in `slides-text.md` appendix) |

**Limits of the concepts:**

- Each slide is **one ~1440×1000 frame**: roughly the first screen, not the whole page. Nothing below the fold is defined.
- There are **no mobile or responsive layouts**.
- Navigation varies between slides: About vs Team, and Horizon Scan vs Projects.
- Almost every link is `#`. The only real ones go to the GRAIN report PDF (slide 1) and the White Paper PDF (slide 10).

## Content rule

> [!IMPORTANT]
> **We move content; we don't write it.** We take content from these sources, in this order:
> 1. **Concept text is approved copy.** It is the newest source and is used word for word. Nothing from the old site overwrites it, even where the old site has a different version (e.g. hero "We chart…" replaces "Charting…").
> 2. **Gaps are filled from the live site** (<https://www.odysseaninstitute.org/>), keeping its heading structure. The `existing/` snapshot is a backup copy of the text; its styling isn't accurate.
> 3. **Anything left over** becomes a content request in [open-questions.md](../open-questions.md). We don't write or edit copy ourselves.

**Agreed sources:**

| Need | Source |
|------|--------|
| Publications list (6) | Live `/publications`, every entry |
| Team, FAQ, Curriculum, Contact, Donate, Blog, Focus | The matching live pages. Use their content, but not their styling |
| Page inventory | [scoping.md §2.1](../../scoping.md). Out of date, but still useful if we keep the new structure |
