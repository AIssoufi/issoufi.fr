# Testing

| Level              | Tools                                  | Command                                |
| ------------------ | -------------------------------------- | -------------------------------------- |
| Unit and component | Vitest, Testing Library, jsdom         | `pnpm test`                            |
| Browser            | Playwright, Chromium, WebKit, axe-core | `pnpm build`, then `pnpm test:browser` |
| Screenshots        | Playwright, Chromium                   | `pnpm test:visual`                     |

## Unit and component tests

- Every component, helper and hook has its spec, next to it: `*.spec.jsx` for components, `*.spec.ts` for helpers and hooks, `*.spec.js` for the JavaScript helpers. The browser tests are the `e2e/*.e2e.ts` files.
- The coverage must stay at 100 %: the CI fails below.
- A test that logs an error fails, so the output stays clean.
- Some specs build the whole site in memory, and check every generated page and header, with the page rendered in it.
- The spec of a component whose render depends on the visitor renders it as the build does, then hydrates it, with `renderHydrated` (`src/hydrationTestUtils.tsx`). `src/prerender.spec.jsx` hydrates every page rendered at build time.
- The specs of the GitHub helpers in `scripts/ci/utils/` stub the GitHub API with `stubGitHubEnv` and `stubGitHub` (`scripts/ci/utils/testUtils.js`), as a new spec of a GitHub helper should, with the fixtures of the release pull request (`REPOSITORY`, `SHA`, `apiRun` and `workflowRun`, one run as the REST API writes it and as `readRun` gives it, the routes of a release that goes well in `releaseRoutes`); only `github-api.spec.js`, which tests the client itself, stubs `fetch` on its own. The stub answers each route, `<method> <path>` under the API of the repository, from a queue whose last answer serves every next request; a route written with the exact query of a request (`GET /runs?event=schedule`) answers it before the route without one. It returns the requests with their route, address, headers and body, and `routesOf` lists their routes in their order.

## Browser tests

jsdom computes no layout, so these tests run in Chromium, on the production build, and those of phones in WebKit too.
`pnpm preview` serves that build as Cloudflare Pages does, even on the disk of macOS, which ignores case: a path that names no file, case included, gets the closest not found page up its folders, `en/404.html` under `/en/` and `404.html` elsewhere, with the status 404 (`vite/preview/middlewares/notFoundPages.ts`), so the tests check the status and the `noindex` of the not found page. A file of the build gets the `Cache-Control` that the rules of `HEADER_RULES` give its path, the rules that the build writes to `_headers`, in place of the `no-cache` of Vite (`getCacheControl` in `vite/preview/utils/headers.ts`): a browser keeps the hashed files of `assets/` a year, as on Cloudflare Pages, rather than revalidating them on each load of a test. It sends the CORS headers of Cloudflare Pages, `Access-Control-Allow-Origin: *` and no `Vary` (`PREVIEW_CORS` in `vite/preview/constants.ts`), in place of the `Vary: Origin` of Vite, which made WebKit download a web font again on each load of a page, since it requests the font with an `Origin` header for its preload and without one for its `@font-face` (`e2e/font-cache.e2e.ts`). Before any file, it answers the routes that Cloudflare Pages answers itself (`cloudflareRoutes`, helpers in `vite/preview/redirects.ts`): the source of a rule of `dist/_redirects`, read with `parseRedirectRules`, the parser of the CI check, gets the status and the target of its rule with any method, carrying the security headers and the query of the request (`/code?a=1` to the repository with `?a=1`); like Cloudflare Pages, it compares the whole path as it was sent, so `/code/`, `/Code` and `/c%6Fde` get the not found page, and the query of a target that has one wins over the query of the request. A path that names a file of the build, case included, by another path than its canonical one gets a 308 to that path, relative and with the query of the request, carrying the security headers and no `Cache-Control` (`/en` to `/en/`, `/projects/` and `/projects.html` to `/projects`, `/index.html` to `/`), and `/_headers` and `/_redirects` get the not found page with the status 404, so a test never passes at a URL that production redirects (`e2e/redirects.e2e.ts`). A source with a splat or a placeholder only matches itself, since the rules of the site have none, and the preview does not reproduce the redirect of a path with a double slash (`/en//projects/`), nor the `Content-Type: text/plain` of a redirect.
In the CI, `.github/actions/playwright` installs the headless shell of Chromium, cached, and takes its system libraries from the image of the runner, falling back to the apt mirror only when the browser does not start ([decision 0022](decisions/0022-chromium-libraries-from-runner-image.md)).
The WebKit shards run in the image of Playwright, pinned by its digest, which holds WebKit and the system libraries that the image of the runner lacks, so they read no apt mirror ([decision 0024](decisions/0024-webkit-in-playwright-image.md)).
They run in both languages, on screens from small phones to large desktops:

| Area          | What they check                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout        | no sideways scroll; the cards, the header, the menu and the home page hold their layout at every width; the buttons draw their text in the font of the site       |
| Accessibility | contrast, names that hold their visible text, headings and what screen readers read, keyboard navigation, touch targets, text size, reduced motion, forced colors |
| Images        | each screen downloads the right photo and screenshot sizes, and no screenshot of a hidden project card                                                            |
| Server        | each page in its language, the redirects to the canonical path of a page, the short links, the security headers and policy, no request to Google                  |
| Hydration     | each page shows without JavaScript, then React takes it over with no error, for a visitor whose state differs from the build                                      |
| No JavaScript | from each page, on a phone and a laptop, the header leads to every page of the navigation and to the other language; the projects page shows every project        |

The required `browser-test` check of the CI passes once every Chromium and WebKit shard passed. When one did not, its error names each such shard after its browser, which it reads in the jobs of the run: `The browser tests did not pass in WebKit: shard 2/3 ended with 'failure'.`

### In WebKit

The `webkit` project of `playwright.config.ts` runs the specs of phones in WebKit, the engine of Safari, with the device of an iPhone 13: `axe.e2e.ts`, `horizontal-overflow.e2e.ts`, `mobile-menu.e2e.ts`, `no-script-navigation.e2e.ts` and `touch-targets.e2e.ts`. It also runs `redirects.e2e.ts` and `font-cache.e2e.ts`, which check no phone but how Safari handles the answers of the server: it follows the redirects of the preview as production answers them, and keeps the fonts in its cache, which a `Vary: Origin` in the answer made it drop.
Each spec that depends on the size of the screen still sets it. The `chromium` project runs every spec.

- `pnpm test:browser` runs both projects; `pnpm test:browser --project=webkit` runs WebKit alone, and `--project=chromium` Chromium alone.
- In the CI, the `browser-test (webkit 1/3)` to `browser-test (webkit 3/3)` jobs split them in three shards (`--shard=<i>/3`), on runners of their own beside the three Chromium shards, so that the required `browser-test` check waits no longer for WebKit than for Chromium. A shard that fails uploads its `test-results/`, with a screenshot of each failed test, as the artifact `browser-test-results-webkit-<shard>`.
- The three shards run in `mcr.microsoft.com/playwright`, whose tag names the version of `@playwright/test` in the lockfile. When that version changes, the pull request changes the tag and the digest of `container.image` in `.github/workflows/ci.yml` too: Dependabot updates neither, and WebKit does not launch in the image of another version, whose name its error gives. `curl -sSI -H 'Accept: application/vnd.oci.image.index.v1+json' https://mcr.microsoft.com/v2/playwright/manifests/v<version>-noble | grep -i '^docker-content-digest'` prints the digest of a tag.
- The `workflows` job of the CI fails, with an annotation on the line of `container.image`, when that tag names another version than the lockfile. Write the tag that the annotation gives, keep its distribution (`-noble`), and replace the digest with the one that its `curl` command prints; never change the lockfile to match an older image. A failure on `pnpm-lock.yaml` means the lockfile lists no `@playwright/test` under `importers:`: run `pnpm install`. To run the check locally: `node scripts/ci/check-playwright-image.mjs`.
- The two tests of `mobile-menu.e2e.ts` that scroll with a wheel or a finger through the DevTools protocol run in Chromium only, which alone has it; the others run in both browsers.
- The screenshot comparison runs in Chromium only.

## Screenshot comparison

`pnpm test:visual` shows what a change draws differently, page by page.

- It builds the working tree and its base, the commit where it left `origin/develop`, then screenshots every page in both languages, on a phone, a tablet, a laptop and a desktop screen.
  Run `git fetch origin` first; `--base <ref>` compares with another branch. It takes about a minute.
- The screens of the base are the expected ones. A changed screen does not fail the run, since the change may mean it; a page that does not load does.
- Both builds render alike: a fixed date, fixed random values, reduced motion, and every image and font loaded.
- The HTML report shows each changed screen before and after the change, with their diff and a slider: `pnpm exec playwright show-report visual-report`.
- On a pull request, the `visual` job lists the changed screens in its summary and uploads the report as its `visual-report` artifact. No ruleset requires it.

## Pitfalls

### Vitest and jsdom

- **Logged errors**: fix the warning. Await a page loaded with `React.lazy` with a `findBy` query or `waitFor`. Silence an error that the test expects with `vi.spyOn(console, 'error').mockImplementation(() => {})`.
- **Setup**: it runs for the specs of the node environment too, so it guards every DOM global it touches.
- **Texts of the lazy pages**: the setup adds every text, those of the lazy pages included. A spec cannot see a component of the main bundle read a text of a lazy page (`projects.*`, `exp.*`), which shows its key on the other pages: keep those texts to their page.
- **Wrappers**: the setup wraps every render in the theme, so a spec adds no `ThemeProvider`. Wrap a component that routes in `<BrowserRouter>`.
- **Styles**: styled-components writes its rules to the CSSOM, not to the text of `<style>`. Read them with `listStyleRules` and `declaredStyle`, check with `mediaDeclaringStyle` that an effect applies under one media query and in no other, and build an expected value with `serializeCssValue`, since the CSSOM rewrites values (`0` as `0px`).
- **What jsdom ignores**: media queries (but `all` and `screen`), pseudo-elements in `getComputedStyle`, and the focus of an element hidden by `display: none`. Read the declared rules instead.
- **`:focus-visible`**: jsdom keeps its state for a whole file. Check what the focus shows, not the pseudo-class.
- **Mocks**: Vitest clears the calls of every mock before each test (`clearMocks`, the default since Vitest 5). Assert the calls that the test makes, never those of a `beforeAll` or of the top of the file. Await every `resolves` and `rejects`: one left unawaited fails the test.
- **`matchMedia`**: jsdom has none. Stub it with `stubMatchMedia`, and undo it with `vi.unstubAllGlobals()`.
- **Hydration**: in production, React keeps an attribute of the build that differs from its own render, and says nothing. In a test, the development build of React logs it, which fails the test.
- **Child processes**: the CI sets `FORCE_COLOR`, which colors the output of a script that a spec runs, such as commitlint. Give it `UNCOLORED_ENV` (`scripts/testUtils.js`) as its environment before reading its text: it leaves `FORCE_COLOR` out and sets `NO_COLOR=1`. Without it, the spec passes locally and fails in the CI, so run it once as the CI does: `FORCE_COLOR=1 pnpm test <spec>`. A spec that runs a Node.js script, such as a check of `scripts/ci/`, calls `runNodeScript({ script, cwd })` of the same file, which gives it that environment and resolves to `{ exitCode, log, errorLog }` instead of throwing.
- **Render in Node.js**: React leaves the contexts of a render at build time set, in the same JavaScript realm. Run `await prerender(null)` before hydrating in the same file, as `src/prerender.spec.jsx` does.

### Playwright

- **Animations**: wait for them to end before measuring a box (`waitForEndingAnimations`), or open the page with reduced motion. An element still sliding in stands elsewhere.
- **Loading**: wait for what the page shows with `await page.evaluate(waitForPageContent)` (`e2e/loading.ts`): its images on the screen, its background photo, then its web fonts. Never wait for `networkidle`, which waits for requests that no test measures and, in WebKit, sometimes never ends ([#413](https://github.com/AIssoufi/issoufi.fr/issues/413)).
- **Proof**: check that a new test fails without its fix, at every size it covers.
- **Download priorities**: Chromium raises the priority of an image that shows on the screen while it downloads, which a local server answers first. Slow the network down (`SLOW_4G_NETWORK`), as `e2e/download-priorities.e2e.ts` does.
- **WebKit**: as Safari on macOS, it leaves the links out of the order of Tab, so a test that moves the focus to a link presses `Alt+Tab` there (`NEXT_LINK_KEYS` in `e2e/mobile-menu.e2e.ts`). Playwright turns no mouse wheel in WebKit on a phone: scroll the page with `window.scrollTo`. WebKit has no DevTools protocol (`newCDPSession`): skip a test that uses it there, with its reason. WebKit draws in software on the Linux of the CI: the `webkit` project draws at a scale of 1 and gives a test 60 s everywhere.
- **Lost navigation in WebKit**: every page of the site sends `Cross-Origin-Opener-Policy: same-origin`, so WebKit loads the first page of a new tab in a new process. When the answer of the local server reaches WebKit before the old process says that the load started, WebKit cancels the new process and drops the navigation with no error ([WebKit bug 327297](https://bugs.webkit.org/show_bug.cgi?id=327297)). `page.goto` then waits for `load` until the timeout, on a white page that stays at `about:blank`. It hits any route, about 1 test in 3300 in the container of the CI, and the site is not at fault ([#467](https://github.com/AIssoufi/issoufi.fr/issues/467)): a test that times out that way in WebKit is this race, not a bug of its page.
- **Screenshots**: a screen that changes with no change of the code draws something that moves from a run to the next, such as the time, a random value or a late image. Fix it in `e2e/pages.visual.ts` rather than tolerate a difference.
