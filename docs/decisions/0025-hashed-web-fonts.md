# 0025. Serve the web fonts under hashed names, cached a year

- Date: 2026-10-24
- Status: Accepted

## Context

The pages loaded their web font, the Montserrat file of `FONT_FACES` (`src/theme/constants.ts`), from `public/fonts/montserrat-latin.woff2`, a fixed name that no rule of `_headers` covers. Cloudflare Pages served it with its default policy, `public, max-age=0, must-revalidate`, so a browser asked for it again on every page load, and Cloudflare answered from its cache with `cf-cache-status: REVALIDATED`. The files of `assets/` carry a hash of their content in their name, and the `/assets/*` rule of `_headers` caches them a year as immutable ([#426](https://github.com/AIssoufi/issoufi.fr/issues/426)).

The ticket also saw WebKit request the font again after the `load` event, and sometimes never reach `networkidle`. The measures below, ten loads of `/experiences` in WebKit, found no late request and no load that missed `networkidle`.

## Decision

In the pull request of [#426](https://github.com/AIssoufi/issoufi.fr/issues/426):

- In `buildStart`, the `font-faces` plugin of `vite.config.ts` copies each file of `FONT_FACES` into the bundle as an asset, which Rolldown names after a hash of its content: `assets/montserrat-latin-l_AIctKy.woff2`.
- The preload links and the `@font-face` rules that the plugin writes in the head of every page take the URL of that copy, which the `/assets/*` rule of `_headers` serves with `public, max-age=31536000, immutable`. The build fails when a file of `FONT_FACES` has no copy. The `@font-face` rules stay in the head, out of `GlobalStyle` and styled-components, and `font-src 'self'` of the Content Security Policy still allows them.
- The dev server keeps the URLs of `public/`. The standalone build asks the plugin to keep them too, through its new `keepPublicUrls()`, since it embeds the files of `public/` as data URLs and must find those URLs in the page.
- The files stay in `public/fonts/`, beside their licenses, where `pnpm og-image`, `pnpm icons` and `pnpm cv` read them, and Vite still copies them to `dist/fonts/` under their names, as it copies the whole of `public/`.

## Alternatives considered

- **A long cache for `/fonts/*` in `_headers`**, under the fixed names: a font changed under the same name would stay a year in the cache of the browsers that loaded it, and `immutable` would be wrong.
- **A version in a query string** (`/fonts/montserrat-latin.woff2?v=<hash>`): the rules of `_headers` match the path, not the query, so the fixed name would still need its own long cache, with the same risk as above.
- **Moving the fonts to `src/` and importing their URLs**, so that Vite hashes them as any import: `pnpm og-image`, `pnpm icons` and `pnpm cv` read them in `public/fonts/`, beside their licenses, and Vite copies the files of `public/` under their own names: an import of one gives its fixed URL.
- **The `Cache-Control` of `_headers` in `pnpm preview` too**, which sends `no-cache` for every file, so that the browser tests see the cache of production: left to [#429](https://github.com/AIssoufi/issoufi.fr/issues/429).

## Consequences

Response headers from `curl -sI`. Font requests of ten loads of `/experiences` in WebKit, through Playwright: in a new browser context for each load, then ten loads in one context, at 1024 px and on the device of an iPhone 13. Before: `develop`, before the first commit of the branch, in `pnpm preview` and on https://issoufi.fr. After: the branch of #426, in `pnpm preview`.

| Figure                                         | Before                               | After                                                       |
| ---------------------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| URL of the font of the pages                   | `/fonts/montserrat-latin.woff2`      | `/assets/montserrat-latin-l_AIctKy.woff2`                   |
| `Cache-Control` in production                  | `public, max-age=0, must-revalidate` | `public, max-age=31536000, immutable`, from `dist/_headers` |
| `Cache-Control` in `pnpm preview`              | `no-cache`                           | `no-cache`                                                  |
| Requests, one context per load, preview        | 10, at both sizes                    | 10, at both sizes                                           |
| Requests, ten loads in one context, preview    | 15, at both sizes                    | 15, at both sizes                                           |
| Requests, ten loads in one context, production | 10                                   | not measured: after the deploy                              |
| Late requests or loads without `networkidle`   | 0                                    | 0                                                           |
| Font files in `dist/`                          | 2, 58,720 bytes                      | 3, 96,676 bytes                                             |

- A browser that loaded the font keeps it a year, and asks for it again only when its content, so its name, changes.
- `pnpm preview` still sends `no-cache`, so the browser tests see no change: in one context, WebKit requested the font twice on every other reload, before and after.
- `dist/` holds the font twice, 37,956 bytes each, under both names: only the hashed copy is loaded by the pages.
- Left to do: check the header of the hashed font with curl on https://issoufi.fr after the deploy, and the requests of ten loads in one context there.
