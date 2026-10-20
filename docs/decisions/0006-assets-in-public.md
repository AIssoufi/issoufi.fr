# 0006. Serve the images and the CV from the site

- Date: 2026-03-21
- Status: Accepted

## Context

The images of the pages and the projects, and the PDF of the CV, were files of a Firebase Storage bucket: the code held 17 `https://firebasestorage.googleapis.com/…` URLs. Each file depended on that bucket and its project, outside the repository, so a page loaded from two origins, and a checkout of the repository did not hold the files it showed.

## Decision

Commit `a3fcc66`, pushed to the default branch with no pull request, on 2026-03-21, adds the files to `public/` and replaces each URL with the path of its file on the site.

## Alternatives considered

The commit records no alternative. The ones open then:

- **Keep Firebase Storage**: the files stay outside the repository and on a second origin.
- **Imports through the bundler** (`import photo from './photo.jpg'`): a hash in each file name, but every page and data file that names an image moves to imports.

## Consequences

Counted on 2026-10-20 with `git grep` and `git show --stat` on each commit; the answer of Firebase read with `curl` the same day.

| Figure                          | Before (`a3fcc66^`) | After (`a3fcc66`)                   |
| ------------------------------- | ------------------- | ----------------------------------- |
| Firebase Storage URLs in `src/` | 17                  | 0                                   |
| Files added to `public/`        |                     | 17, 8,485,648 bytes (images and CV) |
| Answer of the 17 old URLs       |                     | HTTP 402 on 2026-10-20              |

- The site serves every file it shows, from its own origin: the Content Security Policy that came later allows the files of the site only ([Deployment](../deployment.md)).
- The old URLs no longer serve their files: a copy of the site from before this commit shows no image today.
- The repository holds the files, so a change of an image goes through a commit. The images were later converted to WebP, in several widths, with the commands of [Assets](../assets.md).
