# 0023. Run the phone browser tests in WebKit too

- Date: 2026-10-23
- Status: Accepted

## Context

The browser tests ran in Chromium only, and Safari stayed untested ([decision 0013](0013-playwright-browser-tests.md)). The specs of phones ran in Chromium too, on the screen size of a phone: a layout, a menu or a touch target that Safari draws otherwise passed every check of the CI. Safari draws pages with WebKit, as most browsers of iOS do.

Run in WebKit on an iPhone 13 before this change, on macOS, the five specs of phones failed 15 of their 208 tests, none of them on a bug of the site:

- two tests of `e2e/mobile-menu.e2e.ts` scroll through the DevTools protocol, which only Chromium has;
- WebKit, as Safari on macOS, leaves the links out of the order of Tab, and reaches them with Option and Tab;
- Playwright turns no mouse wheel in WebKit on a phone.

## Decision

In the pull request of [#404](https://github.com/AIssoufi/issoufi.fr/issues/404):

- `playwright.config.ts` gets a `webkit` project, with the device of an iPhone 13, which runs `axe.e2e.ts`, `horizontal-overflow.e2e.ts`, `mobile-menu.e2e.ts`, `no-script-navigation.e2e.ts` and `touch-targets.e2e.ts`. Each spec still sets the size of its screens.
- The test of the open menu on a screen lower than it splits in two, so that only its wheel scroll runs in Chromium alone, with the other test that scrolls through the DevTools protocol. In WebKit, the test of the language toggle presses Alt and Tab, the Option and Tab of a Mac. The test of `no-script-navigation.e2e.ts` that scrolls before the menu opens scrolls the page with `window.scrollTo` in every browser.
- A `browser-test (webkit)` job of the CI runs the `webkit` project on its own runner, beside the three Chromium shards, which run the `chromium` project alone. The `browser-test` check, which both rulesets require, fails when that job did not pass.
- `.github/actions/playwright` takes the browser to install as an input, part of the key of its cache. It launches the browser once, and installs its system libraries from the apt mirror only when that launch fails, as [decision 0022](0022-chromium-libraries-from-runner-image.md) does for Chromium: the image lacks libraries of WebKit, so the WebKit job reads the mirror on every run.
- The `webkit` project draws at a scale of 1, not the 3 of an iPhone: WebKit draws in software on the Linux of the CI, where a scale of 3 draws nine times as many pixels, and the WebKit job of run 39997565866 ran past its 15 minutes.
- A test of WebKit may take 60 s, twice the 30 s of Playwright: in run 40000993727, a test of `no-script-navigation.e2e.ts` that loads `/experiences` four times ran past 30 s at 1280 px, and its siblings took 28.8 s to 29.5 s.
- In the CI, a failed test of WebKit runs once more: in runs 40002976719 and 40005049096, the `networkidle` wait of `/en/experiences`, loaded whole, never ended, once in some 200 tests. A test that WebKit really fails fails both runs.
- The screenshot comparison stays in Chromium.

## Alternatives considered

- **WebKit in the Chromium shards**: each shard would install WebKit and its libraries, then run its tests after those of Chromium, so every shard would last longer.
- **Every spec in WebKit**: more than four times as many tests in WebKit, and some specs read what only Chromium gives, such as `e2e/download-priorities.e2e.ts`, which records the priorities of the downloads through the DevTools protocol.
- **Firefox as well**: Firefox for Android draws with Gecko, a third engine to install and run, which the ticket left out.
- **The `mcr.microsoft.com/playwright` image for the WebKit job**, which holds the libraries of every browser: the reasons of decision 0022, an image of every browser to pull on every run and a version to keep equal to the lockfile in the workflow.

## Consequences

Durations of the jobs of the CI and of the step of `.github/actions/playwright` in them, from `gh api 'repos/AIssoufi/issoufi.fr/actions/runs/<run>/jobs'`. Before: the 10 runs of `ci.yml` on `develop` from 39855786685 to 39917662878, after decision 0022. After: the three attempts of run 40005049096 of `ci.yml`, on a copy of the branch of this pull request with its deploy jobs turned off. The WebKit job reached its tests in five runs of such copies: 39997565866, 40000993727, 40002976719, the first attempt of 40005049096, and 40012465914.

| Figure                             | Before           | After                             |
| ---------------------------------- | ---------------- | --------------------------------- |
| Browser tests in Chromium          | 904              | 906                               |
| Browser tests in WebKit            | 0                | 210, 8 of them skipped            |
| Shard 1/3, median of the job       | 214 s            | 192 s                             |
| Shard 2/3, median of the job       | 175 s            | 175 s                             |
| Shard 3/3, median of the job       | 172.5 s          | 189 s                             |
| WebKit job                         |                  | 548 s, in its one green run       |
| Playwright step of a shard, median | 4 s (3 s to 7 s) | 5 s (3 s to 7 s)                  |
| Playwright step of the WebKit job  |                  | 47 s (29 s to 59 s), in five runs |

- Safari on an iPhone gets the checks of the layout, of accessibility with axe-core, of the navigation without JavaScript, of the menu and of the touch targets.
- The Chromium shards keep their duration: the median of their test step is 164 s, 154 s and 156 s, against 187.5 s, 154.5 s and 152.5 s before. The job of shard 3/3 took 189 s, against 172.5 s, since two of its three attempts reached the Playwright step 29 s and 24 s after their start, against 13 s in the first: the steps before it, checkout, setup and download of the build, stay as they were.
- The `browser-test` check waits for the longest of four jobs instead of three, and the deploy with it: the WebKit job, 548 s, against 192 s for the longest shard.
- The WebKit job reads the apt mirror of Ubuntu on every run. In attempts 2 and 3 of run 40005049096, the mirror crawled, and the job hit its 15 min timeout in that step, at 892 s and 891 s, before any test: the `browser-test` check failed. [#412](https://github.com/AIssoufi/issoufi.fr/issues/412) installs those libraries without apt on every run.
- The CI runs a failed test of WebKit twice until [#413](https://github.com/AIssoufi/issoufi.fr/issues/413) waits for what each test needs instead of `networkidle`.
- A test that fails in WebKit alone fails the CI. In run 40012465914, on a throwaway copy of the branch, a test of `touch-targets.e2e.ts` that expects Chromium failed in WebKit, then again on its retry; the three Chromium shards passed, and the `browser-test` check failed.
