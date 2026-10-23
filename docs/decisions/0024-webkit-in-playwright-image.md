# 0024. Run the WebKit tests in the image of Playwright

- Date: 2026-10-23
- Status: Accepted

## Context

[Decision 0023](0023-phone-browser-tests-in-webkit.md) runs the specs of phones in WebKit, in the `browser-test (webkit)` job of the CI. Its `.github/actions/playwright` step restores WebKit from its cache, but the image of the runner lacks most of the system libraries that WebKit links, GStreamer among them, so the step installs them from the apt mirror of Ubuntu on every run: 181 new packages and 6 upgrades, 117 MB of archives.

That step took 47 s in the median of five runs, from 29 s to 59 s, but the mirror sometimes sends at about 40 kB/s. In attempts 2 and 3 of run 40005049096, the job hit its 15-minute timeout in that step, at 892 s and 891 s, before any test, and the `browser-test` check that both rulesets require failed with it ([#412](https://github.com/AIssoufi/issoufi.fr/issues/412)).

## Decision

In the pull request of [#412](https://github.com/AIssoufi/issoufi.fr/issues/412):

- The `browser-test (webkit)` job runs in the container `mcr.microsoft.com/playwright:v1.64.0-noble`, pinned by its digest. The image holds the browsers of Playwright 1.64.0 in `/ms-playwright`, with their system libraries, so the job installs nothing from apt.
- The container runs as the user 1001, the user of the runner, who owns the workspace, as the example of the Playwright documentation does.
- The job no longer runs `.github/actions/playwright`: the image holds WebKit, and the cache of the action, saved on the runner, restores the browser to a `/.cache` folder that this user cannot create. In run 40016984386, the restore failed with a warning (`Cannot mkdir: Permission denied`), the tests ran with the browsers of the image, and the cache saved nothing.
- The tag names the version of `@playwright/test` in the lockfile, which must match: in an image of another version, the first launch of WebKit fails and asks to update the image. Dependabot updates neither the tag nor the digest, so the pull request that updates Playwright changes both ([docs/testing.md](../testing.md#in-webkit)).
- The Chromium shards and `visual` keep `.github/actions/playwright` and the libraries of the runner image ([decision 0022](0022-chromium-libraries-from-runner-image.md)).

## Alternatives considered

- **A cache of the `.deb` files**, keyed on the version of the runner image and that of Playwright, measured in the same runs as the image. A warm job restored the 187 files, 112 MB, then installed them with `dpkg` in 12 s, from 12 s to 16 s in four runs, without the mirror. But the key changes with every version of the runner image, and the runners of one day do not all run the same: in run 40019432304, a runner of image 20261021.618 missed the cache that one of image 20261012.601 had saved an hour before, and read the mirror again. Filling the cache reads the mirror as decision 0023 does: in run 40016984386, the job was still in apt when cancelled, 888 s after the start of that step. A slow mirror could still cancel the job on each new image, each image keeps its own 112 MB in the cache of the repository, and the install runs `dpkg` as root.
- **apt with a longer timeout**: the job would wait for the same mirror, and a composite action has no `timeout-minutes` for its steps (decision 0022).
- **The image for the Chromium jobs too**: they take their libraries from the image of the runner in 5 s (decision 0022), less than the pull of the image.

## Consequences

Durations of the WebKit job and of its steps, from `gh api 'repos/AIssoufi/issoufi.fr/actions/runs/<run>/jobs'`. Before: the five runs of decision 0023 whose WebKit job reached its tests, 39997565866, 40000993727, 40002976719, the first attempt of 40005049096 and 40012465914, with attempts 2 and 3 of 40005049096. After: five runs of a throwaway workflow started together on a copy of the branch of decision 0023, 40019427730, 40019432304, 40019437646, 40019442297 and 40019447176, whose `container` job ran the WebKit tests in the pinned image. That job still ran `.github/actions/playwright`, 5 s in the median, which the job of the CI drops. The same runs had an `apt` job, which installs the libraries as decision 0023 does, and the `deb-cache` job of the alternatives; three earlier runs of that workflow, 40016602075, 40016984386 and 40018942163, had the same three jobs.

| Figure                                        | Before                      | After                  |
| --------------------------------------------- | --------------------------- | ---------------------- |
| Playwright step, then pull of the image       | 47 s (29 s to 59 s)         | 26 s (25 s to 36 s)    |
| Start of the tests, from the start of the job | 68 s                        | 57 s                   |
| WebKit job                                    | 548 s, in its one green run | 467 s (322 s to 487 s) |
| Jobs cancelled before their tests             | 2 of 7 attempts, in apt     | 0 of 8 runs            |

- A warm run reads no apt mirror: the image holds WebKit and its libraries, and the job installs nothing. In the same five runs, the `apt` job hit its 15 min timeout in four, from 887 s to 897 s into its Playwright step, and took 396 s in the fifth. Over the eight runs of the workflow, it was cancelled five times, and the `container` job passed all eight.
- Each run pulls the image from `mcr.microsoft.com`: 7 layers, 986 MB compressed for amd64, which the step that starts the container pulled in 36 s at most over the eight runs.
- The test step, which this change does not touch, took 418 s in the median, from 261 s to 425 s.
- An update of Playwright changes the image by hand: a pull request of Dependabot that updates `@playwright/test` fails the WebKit job until it changes the tag and the digest, and no check compares the tag with the lockfile yet.
- The Chromium shards and `visual` keep their steps, and the libraries of the runner image ([decision 0022](0022-chromium-libraries-from-runner-image.md)).
