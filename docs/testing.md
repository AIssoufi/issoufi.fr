# Testing

| Level              | Tools                          | Command                                |
| ------------------ | ------------------------------ | -------------------------------------- |
| Unit and component | Vitest, Testing Library, jsdom | `pnpm test`                            |
| Browser            | Playwright, Chromium, axe-core | `pnpm build`, then `pnpm test:browser` |

## Unit and component tests

- Every component, helper and hook has its spec, next to it: `*.spec.jsx` for components, `*.spec.ts` for helpers and hooks, `*.spec.js` for the JavaScript helpers. The browser tests are the `e2e/*.e2e.ts` files.
- The coverage must stay at 100 %: the CI fails below.
- A test that logs an error fails, so the output stays clean.
- Some specs build the whole site in memory, and check every generated page and header.

## Browser tests

jsdom computes no layout, so these tests run in Chromium, on the production build.
They run in both languages, on screens from small phones to large desktops:

| Area          | What they check                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Layout        | no sideways scroll; the cards, the header, the menu and the home page hold their layout at every width                        |
| Accessibility | contrast, headings and what screen readers read, keyboard navigation, touch targets, text size, reduced motion, forced colors |
| Images        | each screen downloads the right photo and screenshot sizes                                                                    |
| Server        | each page in its language, the security headers and policy, no request to Google                                              |

## Pitfalls

### Vitest and jsdom

- **Logged errors**: fix the warning. Await a page loaded with `React.lazy` with a `findBy` query or `waitFor`. Silence an error that the test expects with `vi.spyOn(console, 'error').mockImplementation(() => {})`.
- **Setup**: it runs for the specs of the node environment too, so it guards every DOM global it touches.
- **Wrappers**: the setup wraps every render in the theme, so a spec adds no `ThemeProvider`. Wrap a component that routes in `<BrowserRouter>`.
- **Styles**: styled-components writes its rules to the CSSOM, not to the text of `<style>`. Read them with `listStyleRules` and `declaredStyle`, and build an expected value with `serializeCssValue`, since the CSSOM rewrites values (`0` as `0px`).
- **What jsdom ignores**: media queries (but `all` and `screen`), pseudo-elements in `getComputedStyle`, and the focus of an element hidden by `display: none`. Read the declared rules instead.
- **`:focus-visible`**: jsdom keeps its state for a whole file. Check what the focus shows, not the pseudo-class.
- **`matchMedia`**: jsdom has none. Stub it with `stubMatchMedia`, and undo it with `vi.unstubAllGlobals()`.

### Playwright

- **Animations**: wait for them to end before measuring a box (`waitForEndingAnimations`), or open the page with reduced motion. An element still sliding in stands elsewhere.
- **Proof**: check that a new test fails without its fix, at every size it covers.
