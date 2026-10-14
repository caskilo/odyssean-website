# Existing snapshot — `existing/www.odysseaninstitute.org/`

> **What it is:** A crawl-based copy of the live Wix site, captured **2026-09-14** (~17:30). Raw server-rendered DOM — Wix JS, inline styles and `WIX_ADS` elements intact; **no images or assets downloaded** (all media still references `static.wixstatic.com`).
> **Status:** ⚠️ **Partial and noisy.** Used as a *fidelity cross-check baseline* for the pages it caught — **not** a golden source, not a working offline site. The real pipeline (scoping §4) remains the source of truth.
> **Companion:** [scoping.md](scoping.md) §4 · [build-plan.md](build-plan.md) tasks 1.2, 1.3, 1.9

---

## Summary

| Metric | Count | Notes |
|--------|------:|-------|
| Total files | 49 | ~29 MB, ~all HTML |
| Usable content pages | **15** | of 18 in sitemap (incl. `/blog` index) |
| Usable blog posts | **5** | of 9 |
| Unique PDFs | **1** | White Paper (saved 3×, byte-identical) |
| Images / other assets | **0** | none downloaded |
| Feeds / sitemaps | 2 | `sitemap.xml`, `blog-feed.xml` |
| Junk files | ~26 | 404 pages, blog-template shells, JS template literals captured as URLs, empty API responses |

**Capture coverage vs the sitemap inventory: ~83% of pages, ~55% of posts, ~10% of PDFs, 0% of images.**

---

## Index — usable content

### Pages (15 of 18)

| File | Route | Size | In sitemap? |
|------|-------|-----:|:-----------:|
| `index.html` | `/` | 782 KB | ✅ |
| `our-work.html` | `/our-work` | 664 KB | ✅ |
| `focus.html` | `/focus` | 712 KB | ✅ |
| `team.html` | `/team` | 753 KB | ✅ |
| `projects.html` | `/projects` | 657 KB | ✅ |
| `faq.html` | `/faq` | 699 KB | ✅ |
| `outputs.html` | `/outputs` | 854 KB | ✅ |
| `publications.html` | `/publications` | 704 KB | ✅ |
| `blog.html` | `/blog` | 938 KB | ✅ |
| `curriculum.html` | `/curriculum` | 887 KB | ✅ |
| `contact.html` | `/contact` | 668 KB | ✅ |
| `donate.html` | `/donate` | 828 KB | ✅ |
| `grain.html` | `/grain` | 647 KB | ✅ |
| `resilient-supply-chains.html` | `/resilient-supply-chains` | 745 KB | ✅ |
| `cause-areas.html` | `/cause-areas` | 700 KB | ✅ |

**Missing pages (3):** `/neld` · `/services-1` · `/donation-thank-you-page` — all orphans or utility pages; ironically the three with open keep/kill questions.

### Blog posts (5 of 9)

| File | Post | Size |
|------|------|-----:|
| `post/an-odyssey-launched-update-on-the-first-odyssean-process.html` | An Odyssey Launched | 1.04 MB |
| `post/our-2025-in-review.html` | Our 2025 in Review | 1.02 MB |
| `post/why-democratic-ai-falls-short.html` | Why Most Efforts Towards "Democratic AI" Fall Short | 1.09 MB |
| `post/3-précis-our-tripartite-research-advocacy-agenda.html` | 3 Précis (non-ASCII slug preserved) | 1.04 MB |
| `post/which-future-is-the-fairest-of-them-all-crafting-deliberative-policy-futures-through-horizon-summ.html` | Horizon Summits post | 1.02 MB |

**Missing posts (4):** `our-2024-in-review` · `applying-a-problem-solving-mindset-…` · `let-s-talk-about-emergence` · `pathways-to-resilience-…`

### Documents & feeds

| File | What | Validity |
|------|------|----------|
| `_files/ugd/odyssean-process-white-paper_2024.09.16.pdf__ filename_=UTF-8_…` (×3) | White Paper PDF, 3.5 MB | ✅ valid `%PDF-`; **all three byte-identical** (md5 `eff930…`) — 1 unique doc, mangled names from a downloader appending Content-Disposition to the URL |
| `blog-feed.xml` | RSS feed, 8 KB | ✅ complete — all 9 posts, authors, Wix post IDs |
| `sitemap.xml` | Sitemap index, 496 B | ✅ |

**Missing documents:** the other ~9 PDFs identified in scoping Appendix A (Horizon Scan, GRAIN, Governance Under Fallout, both NELD papers, Policy Brief, Burton et al., Resilience Reconsidered preprint, `cad45f_63b8af…`).

---

## Index — junk (do not use)

| File(s) | Why it exists | Contents |
|---------|---------------|----------|
| `post/${ie}.html`, `post/${s.uri}.html`, `post/file.mp4.html`, `post/robots.html` | Crawler fetched JS template literals / internal paths literally; Wix renders the generic **blog post shell** for any `/post/<x>` | ~746 KB each of template page, title "Post \| Odyssean Institute" — no unique post content |
| `${s.uri}.html`, `A.html`, `D.html`, `api.html`, `feed.html`, `file.mp4.html`, `__wix.memberDetails.html`, `post/feed.html`, `post/sitemap.html`, `envelope.html`, `embed/error-page.html`, `media/emptystate.85a4add5.html`, `services/editor-elements/dist.html`, `_files/ugd/cad45f_b15af…329b.html` | Same class of noise — Wix-internal URL fragments chased by the crawler | **Wix 404 pages** (~2.2 KB each, `noindex`, "404 Error: Page Not Found") |
| `api/index.html`, `envelope/index.html`, `embed/error-page/index.html`, `services/editor-elements/dist/index.html`, `src/index.html`, `_api/tag-manager/api/v1/tags/index.html` | Index probes on API/service paths | Empty or near-empty bodies (2–700 B) |

---

## Assessment & intended use

**What it is good for:**

- A **frozen copy of real page text** for 15 pages + 5 posts, useful as the *expected output* when diffing our own extraction (task 1.3's side-by-side review, and the G1 parity check). Since it was captured today, it is current.
- `blog-feed.xml` — already the authoritative post list with Wix IDs.
- The White Paper PDF is intact and downloadable.

**What it cannot do:**

- **Substitute for extraction.** Missing 3 pages, 4 posts, ~9 PDFs and *all* images — and those images can only come from `static.wixstatic.com` (Wix Media API or a second asset pull), not from these files.
- **Serve as a clean content source.** The HTML is the *raw rendered DOM*: Wix scripts, `WIX_ADS`, inline styles and generated markup all intact. Parsing it is the same work as parsing a live fetch — the snapshot saves bandwidth, not effort.
- **Prove completeness.** ~26 junk files mean a naive "diff snapshot vs new site" would produce false positives. Only files in the *usable content* index above are diff targets.

**Proposed handling:** keep as-is (do not clean or extend it — our own pull supersedes it); reference it in tasks 1.3 and 1.6 as the comparison baseline for the URLs it covers. If it must be cleaned later, the junk table above is the delete list.
