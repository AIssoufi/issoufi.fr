# Roles

Each agent is a Claude Code session with its own instructions. The skills and agent files of the owner's setup give the details: this page says who decides what.

| Role         | Runs in                                              | Decides                                                                                                        | Never does                                  |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Owner        |                                                      | the look of the site, new features, a rewrite, secrets, rulesets and deploy keys                               |                                             |
| Super master | its own workspace                                    | the number of workers of each master, from the usage quota; the changes of the shared skills, rules and agents | implement a ticket                          |
| Master       | the main checkout, on `develop`                      | which findings become tickets, their priority, which worker takes which ticket, the merges into `develop`      | implement a ticket                          |
| Worker       | one Git worktree, on a branch named after its ticket | how to implement its ticket                                                                                    | merge, open an issue, edit the shared setup |
| Sub-agents   | the background of a master or of the super master    | nothing: they report, their caller decides                                                                     | change the repository                       |

## The owner

Talks to the super master, or opens a master or a worker workspace to talk to it directly. What the owner says there comes first, and the agent tells its coordinator.

## The super master

Starts one master per repository, relays the questions of the masters to the owner one at a time, and alone edits the shared skills, rules and agents, so that several masters never edit the same files at once (`agent-fleet` skill).

## The master

Keeps the board of the repository: it turns requests and findings into issues, after looking for duplicates, sets their priority and gives each ticket to a worker. It checks each pull request on GitHub before merging it (`ticket-master` skill, `agent-fleet/master.md`).

## Workers

One per ticket, each in its own worktree with its own port, so several build and test at the same time. A worker implements its ticket with its tests, runs the reviews and opens the pull request. What it sees outside its ticket goes to the master as a finding (`ticket-master/worker.md`).

## Sub-agents

Started with a written brief, since they do not see the conversation of their caller:

| Sub-agent                               | Started by                                                                           | Returns                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `repo-auditor`                          | a master, at its start and when fewer than three tickets are ready                   | at most fifteen ranked findings, each with its evidence                |
| `workflow-observer`                     | a master after five merges or a day of work, or the super master for the whole fleet | at most five proposals to improve the workflow, each with its evidence |
| `quota-steward`                         | the super master, at its checkpoints                                                 | how many workers the fleet may run now                                 |
| `conventions-reviewer`, `visual-tester` | a worker, before its pull request                                                    | see [reviews](reviews.md)                                              |

## Messages

Agents talk through cmux messages, each starting with a keyword that says what the receiver must do: `QUESTION:`, `BLOCKED:`, `FINDING:`, `UPDATE:` and `DONE:` from a worker; `QUESTION:`, `REQUEST:`, `PROPOSAL:` and `REPORT:` from a master. A message carries its own context, since the receiver does not see the sender's conversation.
