# Architecture

A React single-page app, bundled by Vite.
The build also writes one HTML file per page and language, so that search engines and link previews get the metadata of each page without running JavaScript.

## Pages and languages

- Three pages: Home, Projects and Experiences, plus an error page for unknown paths.
- French at the root (`/projects`), English under `/en/` (`/en/projects`).
- The language toggle opens the same page in the other language, and remembers the choice for the root URL.
- The texts live in `src/i18n/fr.ts` and `en.ts`: the type-check refuses a text missing from either.
- The data of a page (projects, experiences) lives in JSON files next to it, with translation keys instead of texts.

## Static pages

The build writes one HTML file per page and language, each with:

- its title, description, canonical URL and links to the other language;
- Open Graph tags and a link preview image in its language;
- structured data about the site and its owner.

It also writes:

- a not found page per language, which Cloudflare serves with a real 404 status;
- the sitemap, a web app manifest per language and the HTTP headers of Cloudflare.

A new route needs its entry in `src/utils/pages.ts`: without its HTML file, a reload returns a 404.

## Loading

- The home page ships in the main bundle; the other pages load on demand, each from its own chunk.
- Each HTML file preloads the chunks of its page.
- The libraries sit in a chunk of their own, which changes less often than the site, so browsers keep it longer.
- The app preloads the background photo of the page, in a lighter portrait version on phones.
- A tiny placeholder shows until the photo arrives, so a page never goes from black to its photo.
- A page opened before a deployment reloads once when its chunk is gone.

## Behavior

- A page that fails shows a message with a reload button, below a header that keeps working.
- After a navigation, the keyboard focus moves to the title of the new page.
- A skip link, first in the page, leads the keyboard to the content.
- The header stays on screen. On mobile, its menu covers the page and stops it from scrolling.
- The likes of the projects stay in the browser of the visitor, with no counter.

## Browsers

- The build targets the browsers of 2023 on: Chrome and Edge 111, Firefox 114, Safari 16.4.
- The app is type-checked against these browsers, and the tests and tools against Node.js 24.

## Project structure

```
src/
  App/          root component, router, header
  components/   components shared by the pages
  constants/    constants shared across the app
  hooks/        hooks shared across the app
  pages/        Home, Projects, Experiences and the error pages
  i18n/         translations and language helpers
  theme/        design tokens, global styles and fonts
  utils/        pages, generated HTML, sitemap and manifests
e2e/            browser tests
scripts/        CI scripts, and the generators of the link preview, the icons and the CV
vite/           build helpers and the standalone build
public/         images, fonts, icons and CVs
docs/           these guides
.github/        CI, release and deploy workflows, shared actions, Dependabot
```
