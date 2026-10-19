# Editing content

All words on the site live in `src/content/`. Templates contain **no copy**. Every file is checked against a schema (`src/content.config.ts`) when the site builds. If an edit breaks the schema, the build fails and nothing ships.

This guide is for people, and for an LLM assistant making edits on someone's behalf.

## Rules

1. **Don't invent copy.** Text comes from the design concept (approved, verbatim), the current site, or the institute. If something is missing, add a **content request** (see below), not a guess.
2. **Never overwrite concept text with older text.** The concept is newer than the old site.
3. **Every entry records where its content came from** in `sources`.
4. Run `npm run check && npm run verify:content` before you commit.

## Where things live

| Folder               | What                                                                                                                         | Format                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `pages/`             | One file per page. The path is the URL (`pages/grain/methodology.md` → `/grain/methodology`; `index.md` → the folder's root) | Markdown with frontmatter. `template:` decides the fields |
| `posts/`             | Blog posts. The file name is the URL slug (`/post/<file-name>`)                                                              | Markdown with frontmatter                                 |
| `publications/`      | Every entry in the Publications register                                                                                     | YAML                                                      |
| `team/`              | Team, advisors and trustees (`group:`), sorted by `order:`                                                                   | YAML                                                      |
| `signals/`           | The five Horizon Scan signals                                                                                                | YAML                                                      |
| `quotes/`            | Experts & Citizens cards (switched off until ~2027)                                                                          | YAML                                                      |
| `settings/site.yaml` | Organisation details, main nav, footer, microsite sub-navs, feature flags                                                    | YAML                                                      |

Images go next to their content under `src/assets/media/…` and are referenced by relative path. PDFs go in `public/files/<readable-name>.pdf` and are linked as `/files/<name>.pdf`.

## Copy, or a request for it

Any field typed as _copy_ takes either a string or a content request:

```yaml
lede: 'We survey scientists and specialists to surface the emerging trends that matter most.'
# or, when the text doesn't exist yet:
lede:
  request: CR-005 # must also be listed in docs/new-design/open-questions.md
  note: 'What is needed, and why'
```

The site renders a request as a visible placeholder. `docs/content-map.md` lists every open request.

## Sources

```yaml
sources:
  - kind: concept # concept | live | pdf | decision
    ref: '04' # slide number, URL, Wix PDF id, or the plan/decision reference
    note: 'optional detail'
```

## Page templates

| `template`                                                          | Used by                                   | Notes                                                                                           |
| ------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `home`                                                              | `/`                                       | Hero (three art slides, one text) + focus cards                                                 |
| `projects`                                                          | `/projects`                               | Exactly three panels                                                                            |
| `publications`                                                      | `/publications`                           | Filters, type labels, featured block. The list itself is the `publications` collection          |
| `about`                                                             | `/about`                                  | Splash, Why we are Odyssean, Team headings, Experts & Citizens (flagged)                        |
| `focus`                                                             | `/focus`                                  | Three areas. Body: the long-form sections (`## <detailHeading>`)                                |
| `faq`                                                               | `/faq`                                    | Body: one `## Question` per item                                                                |
| `blog`                                                              | `/blog`                                   | Index of `posts`                                                                                |
| `grain-landing` · `scans-landing` · `process-landing` · `modelling` | Microsite landings and the Modelling page | Fields mirror the concept slides                                                                |
| `prose`                                                             | Everything else                           | Optional eyebrow, heading, lede, actions, form, `publications`/`publicationsFor`, `contentFrom` |

## Common tasks

**Add a blog post:** create `posts/<slug>.md` with `title`, `author`, `published` (ISO date), optional `description` (the search-result text; without one, the first paragraph of the post is used), optional `cover` (`src` + `alt`) and `sources`. Then write the body in Markdown.

**Add a publication:** create `publications/<slug>.yaml`. Give it `order`, `title`, `type` (`policy-brief` / `white-paper` / `research-report`), `summary`, a `file` (`/files/…pdf`) or a `url`, `programmes` (which microsite reports pages list it), `verification` and `sources`.

**Switch on Experts & Citizens:** fill in the `quotes/` files, then set `flags.teamSection: experts-citizens` in `settings/site.yaml`.

## Re-running the migration tools

`tools/extract/` holds the scripts that pulled content from the old Wix site. They were run once, then the output was reviewed. Before launch they're re-run to pick up any posts published on Wix in the meantime (build-plan F.4). Don't re-run them over content that has since been edited by hand without checking the diff.
