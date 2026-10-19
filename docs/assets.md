# Assets

## Background photos

Each page shows a photo behind its content, as two WebP files of `public/`:

| File                     | Size                            | Shown on                      |
| ------------------------ | ------------------------------- | ----------------------------- |
| `projects.webp`          | at most 1920 px wide and 110 kB | tablets and landscape screens |
| `projects-portrait.webp` | 3:4, 1000 px high, under 40 kB  | phones held upright           |

A 32 px placeholder, written as a data URL in the entry of the page in `src/utils/pages.ts`, shows until the photo arrives.
Write the three from the original with [cwebp](https://developers.google.com/speed/webp/docs/cwebp):

```bash
cwebp -q 40 -m 6 -resize 1920 0 original.webp -o public/projects.webp
# Portrait, from an original of W × H px: a 3:4 band at its center,
# x = (W - 3H/4) / 2, width = 3H/4, full height
cwebp -q 40 -m 6 -crop x 0 width H -resize 750 1000 original.webp -o public/projects-portrait.webp
# The placeholder, to write after data:image/webp;base64,
cwebp -q 50 -m 6 -resize 32 0 original.webp -o - | base64
```

## Project screenshots

- Each card shows a screenshot in up to four widths: 480, 720, 960 and 1200 px.
- The browser downloads the narrowest one that the card needs on its screen.
- Crop the original to 16:10 at most, then write its files, leaving out the widths above the original (W px):

```bash
for width in 480 720 960 1200; do
  [ "$width" -le W ] && cwebp -q 80 -m 6 -sharp_yuv -resize $width 0 original.png -o public/chess-$width.webp
done
```

- When the original is narrower than 1200 px and of none of these widths, also write it at its own width:
  `cwebp -q 80 -m 6 -sharp_yuv original.png -o public/chess-W.webp`.
- List the files in the `thumbnails` of the project.

## Company logos

Square WebP files of 108 px, twice the size they show at:

```bash
cwebp -q 90 -m 6 -sharp_yuv -resize 108 108 original.png -o public/sewan.webp
```

## Fonts

- Montserrat for the texts, Saira Stencil One for the logo.
- The site serves them itself, with their licenses, and requests nothing from Google.
- The CV prints in static Montserrat files of its own: a variable font would make its text impossible to select in some PDF readers.
- A new font needs its `woff2` file and its license in `public/fonts/`, and an entry in the font list of `src/theme/constants.ts`: a spec checks both.

## Generated files

These files are committed, and never built by the CI.
Regenerate them after a change of their sources, look at them, and commit them with the change:

| Command         | Writes                                    | Run it after a change of               |
| --------------- | ----------------------------------------- | -------------------------------------- |
| `pnpm og-image` | The link preview image of each language   | the home texts, photo, colors or fonts |
| `pnpm icons`    | The favicons and app icons, from the logo | the logo, its font or the colors       |
| `pnpm cv`       | The CV of each language, as a PDF         | a text or a data file that it reads    |

- All three run offline in Chromium. With the same Chromium, a run that changes nothing leaves `git status` clean.
- A spec fails when a CV no longer says what the site says.
- A new language needs its link preview image, the URL of its CV and the texts of its CV. A new icon needs its entry in the icon list and a layout, which a spec matches.
