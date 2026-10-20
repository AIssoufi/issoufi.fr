# Reviews

Before each pull request, the worker has two independent agents check its change (`review-work` skill). They run apart from the worker, so the reasoning that produced the change does not bias them, and in parallel.

| Agent                | Checks                                                                                                                    | Skipped when                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Conventions reviewer | the diff against every rule, skill and `CLAUDE.md` line, then the lint, the types and the tests                           | the change holds no code                                    |
| Visual tester        | screenshots of every page at phone, tablet, laptop and desktop widths, the requested behaviors in Chrome, and regressions | nothing visible can change: CI, docs, scripts or tests only |

The worker checks each finding at its line or on its screenshot, drops the false ones, fixes the others, and has the reviewer check the fix commits only. The verdict goes into the body of the pull request, where the master reads it before merging.

## What waits for the owner

The master merges on its own a change that meets its ticket. Some changes wait for the owner's yes:

- a change of the look: a new layout, columns, a new placement or size of a block. The master shows the before and after screenshots at a phone width and a desktop width, since a layout can meet its criteria and still look wrong;
- a new feature, a new design or a rewrite in another framework, proposed with its reason and its cost;
- anything that needs a secret, a ruleset or a deploy key, which only the owner manages.

A question to the owner goes through the super master, one at a time, with its options and a recommendation.
