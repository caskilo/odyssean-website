# Style guide: component gallery snapshots

> Rendered from the build's internal gallery (`/preview/components`, noindex) on 2026-10-15, after P2. This is a **reference for review**, not the spec: the concept slides remain ground truth ([../extracted/](../extracted/README.md)). Rules and theme tables: [build-plan.md C.3](../../build-plan.md).

| File | Shows |
|------|-------|
| [`1-tokens-logo-buttons.png`](1-tokens-logo-buttons.png) | Colour tokens, type (display / body / mono), logo colourways and mark uses, eyebrows, headline with italic accent, buttons, pills |
| [`2-cards-rows-themes.png`](2-cards-rows-themes.png) | Cards, register rows, roman sections, page title, and the five theme samples (Info, GRAIN, Horizon Scans, Process, Process dark) |
| [`3-headers-art-footer.png`](3-headers-art-footer.png) | Header variants (overlay, microsite plain light and dark), the art registry (final vs placeholder), footer |
| [`full-desktop.png`](full-desktop.png) | The whole gallery at 1440 px |
| [`full-mobile-390.png`](full-mobile-390.png) | The whole gallery at a 390 px viewport |

## Reading notes

- Demo text only (labels such as "Primary", "Card title…"). No site copy.
- Fonts: Arrus BT (display), Instrument Sans (body), DM Mono (labels). Body text appears bold-ish on purpose: the concept embeds only the 600 weight.
- The three hero graphics in the art registry: only **hero-horizon** is final (from the concept). **hero-mountains** and **hero-sea** are stand-ins.
- To refresh these images after later changes: build, run `npx astro preview`, and re-capture `/preview/components`.
