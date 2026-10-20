# Journal and lessons

Each agent session starts from scratch. Two journals, kept in the owner's setup rather than in this repository, carry what must outlast a session.

## The fleet journal

One line per action of a master or of the super master: a worker started or stopped, an issue created or closed, a finding rejected, a pull request merged, a question asked to the owner and its answer, an audit run. Each line names its agent, its target (an issue, a pull request or a URL) and why.

It answers "who did what, and why" after the fact, across sessions that no longer exist. It also feeds the workflow observer, which compares the work with the journal to find what costs time.

Each master also keeps a short state file: its priorities, its running workers, the pull requests waiting and the decisions it waits for. A master restarted after a crash or a compaction of its context reads it to resume.

## The lessons journal

One entry per mistake of an agent: what happened, its root cause and its class (a knowledge gap, an unchecked assumption, a missed convention, an environment quirk, a slip), and its prevention (`learn-from-mistakes` skill).

A mistake likely to recur gets a prevention that would have caught it at the moment it happened: a line in a skill, a rule, a `CLAUDE.md` line, a test or a hook. A repeated entry is the strongest sign that one is needed. For example, a hook refuses a shell command whose next step would run on the exit code of a filter, such as `tail`, rather than on the check before it.

A worker does not write the journal: it sends the lesson to its master, which passes it to the super master, the only agent that edits the shared skills and rules.

## In this repository

A prevention specific to this site lands here: a test, an ESLint rule, or a line of [`CLAUDE.md`](../../CLAUDE.md). The guardrails are listed in the [overview](README.md#guardrails-in-the-repository).
