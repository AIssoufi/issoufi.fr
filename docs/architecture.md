# Architecture

A React single-page app, bundled by Vite.
The build also writes one HTML file per page and language, so that search engines and link previews get the metadata and the content of each page without running JavaScript.

## Pages and languages

- Three pages: Home, Projects and Experiences, plus an error page for unknown paths.
- French at the root (`/projects`), English under `/en/` (`/en/projects`).
- The language toggle opens the same page in the other language, and remembers the choice for the root URL.
- The texts live in `src/i18n/fr/` and `en/`: the type-check refuses a text missing from either.
  Those of the app sit in `app.ts`; those of a lazy page in a file of their own (`projects.ts`, `experiences.ts`), which the `index.ts` of the page adds with `addTranslations` when its chunk loads.
  `src/i18n/fr.ts` and `en.ts` gather every text, for the tests and the scripts.
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

## Rendering at build time

- The build renders the app at the path of each page, in its language, and writes it into the HTML file with its styles: the page shows before any script runs, and without JavaScript.
- React then hydrates it: it takes over the elements of the page instead of drawing them again.
- The render runs in Node.js, in a thread of its own, through a Vite environment with the plugins that the app needs (`vite/prerender/`).
- What depends on the visitor waits for the hydration (`useIsHydrated`): the likes, the durations of the jobs, which the build counts up to its own month, and the path typed on the not found page, whose language links lead to the home until then.
- Without JavaScript, the header still leads to every page and to the other language: the language switch is made of links, and on phones two links stand for the burger button, which open and close the menu through the fragment of the URL (`#menu`).
  Their styles sit in a `(scripting: none)` media query, which a browser that runs scripts never matches, so nothing changes there; a browser that does not know it, such as Safari before 17, shows the burger button, which then does nothing, and Firefox 113 to 120, which knows it but not `:has()`, opens the menu but shows no cross to close it.
- Without JavaScript, the projects page shows every project too: the build renders every card of each section, and those out of the page of the row stay hidden while scripts run, from the first paint, so that their lazy thumbnails download nothing.
  Under the same media query, each section shows its cards on as many rows as they need, as "Show all" does, and hides its arrows and "Show all", which would do nothing; the like buttons stay, inert. Such a browser downloads every thumbnail at once, since browsers lazy load no image without scripts. A browser that does not know the query shows the first page of each row, with its buttons.
- Each styled component gets an id from its module and its place in it, so the classes of the build are those that the browser computes.
- Every Suspense boundary stays in place: React would move a large one to the end of the page, with an inline script that the Content Security Policy blocks.
- The browser renders the app from scratch where the file holds another page than the one of its path: at the root URL that redirects to the stored language, on the not found pages, rendered without a path, and in the standalone build, whose page holds no render.

## Loading

- The home page ships in the main bundle; the other pages load on demand, each from its own chunk, with their texts in every language.
- Each HTML file preloads the chunks of its page.
- The libraries sit in a chunk of their own, which changes less often than the site, so browsers keep it longer.
- The first paint of a page that the build rendered needs only its HTML, its font and its largest image: its scripts download at a low priority, since they only hydrate what already shows.
- The HTML of a page that the build rendered preloads its background photo at a low priority, in a lighter portrait version on phones, with a media query that gives each screen one version; elsewhere, the main script of the app adds that preload.
- On the projects page, the first thumbnail, at the top, downloads at a high priority, and the others at a low one; those of the cards hidden out of the first page of each row download nothing.
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
e2e/            browser tests and the screenshot comparison
scripts/        CI scripts, the Worker of the daily deploy, the link preview, icon and CV generators
vite/           build helpers, the render at build time and the standalone build
public/         images, fonts, icons and CVs
docs/           these guides
.github/        CI, release and deploy workflows, shared actions, Dependabot
```
