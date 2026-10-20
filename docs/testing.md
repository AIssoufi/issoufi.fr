# Testing

| Level              | Tools                          | Command                                |
| ------------------ | ------------------------------ | -------------------------------------- |
| Unit and component | Vitest, Testing Library, jsdom | `pnpm test`                            |
| Browser            | Playwright, Chromium, axe-core | `pnpm build`, then `pnpm test:browser` |
| Screenshots        | Playwright, Chromium           | `pnpm test:visual`                     |

## Unit and component tests

- Every component, helper and hook has its spec, next to it: `*.spec.jsx` for components, `*.spec.ts` for helpers and hooks, `*.spec.js` for the JavaScript helpers. The browser tests are the `e2e/*.e2e.ts` files.
- The coverage must stay at 100 %: the CI fails below.
- A test that logs an error fails, so the output stays clean.
- Some specs build the whole site in memory, and check every generated page and header, with the page rendered in it.
- The spec of a component whose render depends on the visitor renders it as the build does, then hydrates it, with `renderHydrated` (`src/hydrationTestUtils.tsx`). `src/prerender.spec.jsx` hydrates every page rendered at build time.

## Browser tests

jsdom computes no layout, so these tests run in Chromium, on the production build.
They run in both languages, on screens from small phones to large desktops:

| Area          | What they check                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout        | no sideways scroll; the cards, the header, the menu and the home page hold their layout at every width; the buttons draw their text in the font of the site       |
| Accessibility | contrast, names that hold their visible text, headings and what screen readers read, keyboard navigation, touch targets, text size, reduced motion, forced colors |
| Images        | each screen downloads the right photo and screenshot sizes, and no screenshot of a hidden project card                                                            |
| Server        | each page in its language, the security headers and policy, no request to Google                                                                                  |
| Hydration     | each page shows without JavaScript, then React takes it over with no error, for a visitor whose state differs from the build                                      |
| No JavaScript | from each page, on a phone and a laptop, the header leads to every page of the navigation and to the other language; the projects page shows every project        |

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
- **`matchMedia`**: jsdom has none. Stub it with `stubMatchMedia`, and undo it with `vi.unstubAllGlobals()`.
- **Hydration**: in production, React keeps an attribute of the build that differs from its own render, and says nothing. In a test, the development build of React logs it, which fails the test.
- **Render in Node.js**: React leaves the contexts of a render at build time set, in the same JavaScript realm. Run `await prerender(null)` before hydrating in the same file, as `src/prerender.spec.jsx` does.

### Playwright

- **Animations**: wait for them to end before measuring a box (`waitForEndingAnimations`), or open the page with reduced motion. An element still sliding in stands elsewhere.
- **Proof**: check that a new test fails without its fix, at every size it covers.
- **Download priorities**: Chromium raises the priority of an image that shows on the screen while it downloads, which a local server answers first. Slow the network down (`SLOW_4G_NETWORK`), as `e2e/download-priorities.e2e.ts` does.
- **Screenshots**: a screen that changes with no change of the code draws something that moves from a run to the next, such as the time, a random value or a late image. Fix it in `e2e/pages.visual.ts` rather than tolerate a difference.
