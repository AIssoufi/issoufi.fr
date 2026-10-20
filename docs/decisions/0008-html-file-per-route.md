# 0008. Write one HTML file per route

- Date: 2026-10-17
- Status: Accepted

## Context

The build wrote one HTML file, `index.html`, with the title and the description of the home page. Every route of the app shared it: a search engine or a link preview that reads the HTML without running the script saw the home page for `/projects` and `/experiences`, and a static host has no file to serve for those paths.

## Decision

In [#15](https://github.com/AIssoufi/issoufi.fr/pull/15), merged on 2026-10-17:

- `index.html` becomes a template with `%PAGE_*%` placeholders, and `src/utils/pages.ts` lists the pages with their title, description and canonical URL.
- A Vite plugin fills the template for the home page, then writes `projects.html` and `experiences.html` from it.
- `DocumentMeta` keeps the language, the title and the description of the document in line with the route after a navigation in the app.

Later steps extend the list: a `404.html` ([#16](https://github.com/AIssoufi/issoufi.fr/pull/16)), one file per page in each language, and the content of each page rendered into its file ([0015](0015-render-at-build-time.md)).

## Alternatives considered

The pull request records no alternative. The ones open then:

- **A single-page fallback** (a `404.html` copy of `index.html`, or a rewrite of every path to it): each path answers, but with the title and the description of the home page.
- **A static site framework, such as Next.js or Astro**: a file per route with its content, at the cost of a rewrite of the routing and the build, for three pages.

## Consequences

Measured on 2026-10-20 in a detached worktree of each commit, with Node.js 24.22.0 and `pnpm install --frozen-lockfile`. The build time is the median of three runs of `pnpm build` after deleting `dist/`. The metadata are read from the HTML files of `dist/`.

| Figure                                     | Before (`aa8229b`) | After (`57fdcec`) |
| ------------------------------------------ | ------------------ | ----------------- |
| HTML files in `dist/`                      | 1                  | 3                 |
| Pages with their own title and description | 1                  | 3                 |
| Canonical URLs                             | 0                  | 3                 |
| Build time                                 | 4.19 s             | 4.14 s            |
| JavaScript, gzip                           | 204.1 kB           | 204.4 kB          |

- A reload of `/projects` or `/experiences` gets the file of its page, with its title and its description, before any script runs.
- The list of pages is the one place to add a route: today, a route missing from it returns a 404 on a reload ([Architecture](../architecture.md#static-pages)).
- The files hold the metadata of each page, not its content: the content still needs the script, until [0015](0015-render-at-build-time.md).
