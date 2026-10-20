# 0015. Render each page at build time and hydrate it

- Date: 2026-10-19
- Status: Accepted

## Context

Since [0008](0008-html-file-per-route.md), each page had its own HTML file, with its metadata but an empty root: the browser showed the content only once the scripts had downloaded and run, and a visitor or a crawler without JavaScript got no content. The styles of styled-components came with the scripts too ([0005](0005-styled-components.md)).

## Decision

In [#298](https://github.com/AIssoufi/issoufi.fr/pull/298), merged on 2026-10-19, for [#232](https://github.com/AIssoufi/issoufi.fr/issues/232):

- The build renders each page of `PAGES` in each language, and the not found pages, with the `prerender` of React, the static router, the theme and the critical CSS of styled-components, and writes it into the HTML file of the page. The render runs in a worker thread, through a Vite environment with the plugins of the app (`vite/prerender/`).
- The browser calls `hydrateRoot` on a file that holds the page of its path, and `createRoot` elsewhere: the root URL that redirects to the stored language, the not found pages, the standalone build and the dev server.
- What depends on the visitor (the likes, the durations of the jobs, the typed path) waits for the hydration, through `useIsHydrated`, so the first render matches the HTML.
- A build-only plugin gives each styled component a stable id, so the class names of the build match those of the browser. Every Suspense boundary stays in place, since an outlined one needs an inline script that the Content Security Policy blocks.

## Alternatives considered

The pull request records no alternative. The ones open then:

- **A framework that renders at build time, such as Next.js, Astro or React Router in framework mode**: a move of the routing, the build and the tests, for three pages that a Vite plugin can render.
- **A render on each request, on a server or a Worker**: a runtime to host and to secure, for pages that change only with a deploy.
- **Saving each page from a headless browser**: a browser to install and run in each build.

## Consequences

Measured on 2026-10-20 in a detached worktree of each commit, with Node.js 24.22.0 and `pnpm install --frozen-lockfile`: the build time is the median of three runs of `pnpm build` after deleting `dist/`, the sizes of the HTML files are read with `wc -c` and `gzip -c`, and the scripts and styles with `pnpm size`. Lighthouse comes from the description of #298: Lighthouse 12.8.2, mobile with simulated throttling, median per route, before on the preview of `develop` and after on the preview of the pull request.

| Figure                                            | Before (`ad044eb`) | After (`8e2b631`) |
| ------------------------------------------------- | ------------------ | ----------------- |
| Build time                                        | 3.84 s             | 5.61 s            |
| `index.html`, gzip                                | 1.3 kB             | 8.6 kB            |
| `projects.html`, gzip                             | 1.2 kB             | 9.7 kB            |
| `h1` in `projects.html`                           | 0                  | 1                 |
| Scripts and styles of the first load, gzip        | 146.4 kB           | 147.6 kB          |
| All scripts and styles, gzip                      | 159.3 kB           | 161.5 kB          |
| LCP observed by Lighthouse, `/projects`           | 643 ms             | 179 ms            |
| LCP observed by Lighthouse, `/experiences`        | 635 ms             | 185 ms            |
| Performance score, `/projects` and `/en/projects` | 97 and 97          | 98 and 96         |

- The content of each page shows before any script runs, and without JavaScript. Lighthouse observes an earlier LCP on every page but `/`, by 61 to 72 % on the pages of projects and experiences.
- The simulated metrics, which make the score, barely move: they count every request that starts before the first paint, and the scripts and the fonts still do. `/en/projects` loses a point, since its LCP element became the thumbnail of a project. [#299](https://github.com/AIssoufi/issoufi.fr/issues/299) followed it up.
- The build takes 1.8 s more, for the render of the pages: its three runs took 3.27 to 4.61 s before, and 4.81 to 6.19 s after.
- A component that reads storage, the date or the path reads it after the hydration, and its spec renders it hydrated ([Testing](../testing.md)). `e2e/hydration.e2e.ts` fails on a mismatch between the HTML and the first render.
