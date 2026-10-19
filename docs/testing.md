# Testing pitfalls

What the test setup and jsdom do differently from a browser, and how the specs deal with it. How the tests run, and what each browser test checks, is in the [README](../README.md#tests).

## Vitest and jsdom

- **Logged errors**: `src/setupTests.ts` fails a test that logs with `console.error`, so fix the warning. An update outside `act`, such as a page loaded with `React.lazy`, is awaited with a `findBy` query or `waitFor`; an error that the test expects is silenced with `vi.spyOn(console, 'error').mockImplementation(() => {})`.
- **The setup runs everywhere**: `src/setupTests.ts` also runs for the specs of the node environment, so it guards every DOM global it touches.
- **Wrappers**: the setup wraps every `render` in the theme around the wrapper that a spec passes, so a spec adds no `ThemeProvider`; only the specs of `src/theme` render one, to test the theme itself. A component that needs routing is wrapped in `<BrowserRouter>`.
- **Styles in the CSSOM**: since styled-components inserts its rules with `insertRule`, the `<style>` elements hold no text, and the rules are read through `document.styleSheets`. `declaredStyle` (`src/styleTestUtils.js`) also takes the `media` of a rule and reads the rules of a selector list. The CSSOM writes a declared value as browsers do, a length of `0` as `0px`, `calc(24px - 5px)` as `calc(19px)`, `url("/a.webp")` with quotes: build an expected value from the tokens with `serializeCssValue` rather than by hand.
- **What jsdom ignores**: the media queries but `all` and `screen`, and, in `getComputedStyle`, any rule whose selector list holds a pseudo-element (`*, *::before, *::after`): read the declared rules then. It converts computed lengths into pixels, and does not focus an element hidden by `display: none`.
- **`:focus-visible`**: jsdom decides it from the last keyboard, mouse and focus events and from the last element that matched it, which it keeps for the whole file, so it may refuse it after the first `Tab` of a file. Check what the focus shows rather than the pseudo-class.
- **`stubMatchMedia`** (`src/mediaQueryTestUtils.ts`) replaces a global: undo it with `vi.unstubAllGlobals()`.
- **CV specs**: they build the real content of the CV from `CV_SOURCES` (`scripts/cv/testUtils.js`).

## Playwright

- **Wait for the animations**: before a test measures a box or aims the pointer at a point, it waits for the animations of the page that end (`waitForEndingAnimations`, `e2e/animations.ts`), or opens the page with `reducedMotion: 'reduce'`. An element still rising into place stands elsewhere, as the buttons of the home page, 20 px lower during their entrance.
- **Prove the test**: check that a new test fails without its fix at every size it covers, not only at one.
