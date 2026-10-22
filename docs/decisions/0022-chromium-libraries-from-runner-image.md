# 0022. Take the libraries of Chromium from the runner image

- Date: 2026-10-22
- Status: Accepted

## Context

The jobs of the CI that run Playwright, the three `browser-test` shards and `visual`, start with `.github/actions/playwright`. It cached the headless shell of Chromium, then ran `playwright install --with-deps`, which calls `apt-get update` and `apt-get install` for the system libraries of Chromium on every run.

The image of the runner, Ubuntu 24.04, already ships those libraries, since it ships Google Chrome: in the log of a slow job, apt finds every library "already the newest version", and downloads only fonts (`fonts-wqy-zenhei`, `fonts-freefont-ttf`, `fonts-ipafont-gothic`, `fonts-unifont`, `fonts-tlwg-loma-otf`, `xfonts-*`) and updates of `libglib2.0`, `libnss3` and `xvfb`: 25.9 MB. On most runners that takes a few seconds. On some, the Azure mirror of Ubuntu sends them at 41.9 to 67.9 kB/s, and the step lasts up to 588 s: on 2026-10-22, three attempts of run 39788772637 cancelled shard 1/3 at its 10-minute `timeout-minutes` while it still ran this step ([#372](https://github.com/AIssoufi/issoufi.fr/issues/372)).

No test needs those fonts: the site and the CV load their own, and the screenshot comparison takes both sides in the same job.

## Decision

In the pull request of [#372](https://github.com/AIssoufi/issoufi.fr/issues/372), the action runs `playwright install --only-shell chromium` without `--with-deps`, then launches the browser once with Playwright. Only when that launch fails, as when a new image of the runner drops a library, does it run `playwright install-deps chromium-headless-shell` from the apt mirror, so that the jobs still pass, slowly, until the image comes back.

The cache of the browser does not change: its key is the Playwright version, and a cache miss downloads the browser from the servers of Playwright, not from apt.

## Alternatives considered

- **Cache the `.deb` files of apt** (`/var/cache/apt/archives`): `apt-get update` would still read about 8 MB of package lists from the mirror on every run, and the updates of `noble-updates` would miss the cache whenever Ubuntu publishes a new version. It needs copies as root around the cache, for files that no test uses.
- **Run the jobs in the `mcr.microsoft.com/playwright` image**: an image of every browser to pull on every run, a version to keep equal to the lockfile in the workflow, and another user and environment than the other jobs.
- **A timeout and a retry around `--with-deps`**: a composite action has no `timeout-minutes` for its steps, and a retry on the same runner reads the same slow mirror: the job would still cost minutes, only red sooner.

## Consequences

The step was measured on the jobs of the CI, from the start to the end of the step of the action, deduplicated across the attempts of a run. Before: the 44 runs of `ci.yml` from 2026-10-21 06:25 to 2026-10-22 15:16 UTC, on `develop` and pull requests. After: three runs of its pull request on 2026-10-22, two attempts of run 39805802915 with the cache of the browser and run 39808502459 with a cache key that no cache held, where the `visual` job downloaded the browser in its 5 s and the shards, which started later, restored it.

| Figure                       | Before (`--with-deps`) | After |
| ---------------------------- | ---------------------- | ----- |
| Steps measured               | 166                    | 12    |
| Median                       | 17 s                   | 5 s   |
| 90th percentile              | 133 s                  | 6 s   |
| Maximum                      | 588 s                  | 6 s   |
| Steps over 60 s              | 28                     | 0     |
| Shards cancelled in the step | 3                      | 0     |

- The step no longer reads the apt mirror: its duration is the download of the browser from the servers of Playwright on a cache miss, and a launch of it.
- The browsers of the CI draw a character that the fonts of the site lack with the fonts of the image, without the CJK, Thai and Unifont fonts that `--with-deps` added.
- When an image of the runner lacks a library, the fallback brings back the old install, and its duration with it. The image of Ubuntu 26.04, which `ubuntu-latest` moves to from 2026-10-19 to 2026-11-19 ([actions/runner-images#14748](https://github.com/actions/runner-images/issues/14748)), ships Google Chrome too, as its list of software in that repository says.
