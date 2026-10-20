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
- The browser downloads the narrowest one that the card needs on its screen: as wide as the card, or as a 16:10 screenshot cropped to cover it where the card is narrower (352 px).
- Crop the original to 16:10 at most, then write its files, leaving out the widths above the original (W px):

```bash
for width in 480 720 960 1200; do
  [ "$width" -le W ] && cwebp -q 80 -m 6 -sharp_yuv -resize $width 0 original.png -o public/chess-$width.webp
done
```

- When the original is narrower than 1200 px and of none of these widths, also write it at its own width:
  `cwebp -q 80 -m 6 -sharp_yuv original.png -o public/chess-W.webp`.
- List the files in the `thumbnails` of the project.

## README screenshot

The README shows the English home page in `docs/images/home.webp`, at 1440 × 900 px and at most 50 kB, which `src/docsImages.spec.ts` checks for every image of `docs/images/`.
Capture it again with each release that changes the look of the home page: build that release, run `pnpm preview`, screenshot `/en/` at 1440 × 900 px once the animations end, then write it:

```bash
cwebp -q 80 -m 6 -sharp_yuv home.png -o docs/images/home.webp
```

## Company logos

Square WebP files of 108 px, twice the size they show at:

```bash
cwebp -q 90 -m 6 -sharp_yuv -resize 108 108 original.png -o public/sewan.webp
```

## Fonts

- Montserrat for the texts, Saira Stencil One for the logo.
- A button takes the font of its parent (`GlobalStyle`), where a browser gives it the system font of its controls.
- The site serves them itself, with their licenses, and requests nothing from Google.
- The build copies each font file of the pages into `assets/` under a hash of its content, which the pages preload and declare, so that browsers keep it a year ([decision 0025](decisions/0025-hashed-web-fonts.md)). The files stay in `public/fonts/`, where the scripts read them.
- No page loads Saira Stencil One, 20 kB for two letters: the header draws the logo as an inline SVG of their outline, which `pnpm icons` writes from the font. The scripts still read its file.
- The CV prints in static Montserrat files of its own: a variable font would make its text impossible to select in some PDF readers.
- A new font needs its `woff2` file and its license in `public/fonts/`, and an entry in the font list of the pages in `src/theme/constants.ts`: a spec checks both.

## Generated files

These files are committed, and never built by the CI.
Regenerate them after a change of their sources, look at them, and commit them with the change:

| Command         | Writes                                                  | Run it after a change of                      |
| --------------- | ------------------------------------------------------- | --------------------------------------------- |
| `pnpm og-image` | The link preview image of each language                 | the home texts, photo, colors or fonts        |
| `pnpm icons`    | The favicons, the app icons and the outline of the logo | the logo, its font, its spacing or the colors |
| `pnpm cv`       | The CV of each language, as a PDF                       | a text or a data file that it reads           |

- All three run offline in Chromium. With the same Chromium, a run that changes nothing leaves `git status` clean.
- A spec fails when a CV no longer says what the site says, or when the outline of the logo no longer matches its font.
- The CV says less than the Experiences page, which a recruiter reads in a few seconds. A role of `experiences.json` may give the CV its own version of a field: `cvIntro`, `cvBulletKeys`, `cvProjects` or `cvTechnologies` (`cvBulletKeys` for a project too), which the CV writes instead of the field of the page, and an empty list leaves the field out of the CV. Such a version names texts of the page, or texts of the CV only, whose key ends with a part starting with `cv` (`exp.sewanUiKit.cvB1`) in the group of the role in `src/i18n/*/experiences.ts`. A spec refuses a text of the CV that is neither, and a key starting with `cv` on the page.
- A CV tags a job title with the `titleLanguage` of its role in `experiences.json`, as the Experiences page does, so that a screen reader reads an English title of the French PDF in English.
- The document information of a CV, which PDF readers show and recruiting tools index, names its author, a title made of the name and the job title of the CV, and the `subject` and `keywords` of its language in `scripts/cv/.data/cv.json`. The CV takes its `jobTitle` from that file too, more senior and more front-end than the one of the home page, which the line about design of the home page follows on the same line. `pnpm cv` refuses a keyword that the CV does not write, so the information names only what a reader finds in the CV.
- `pnpm cv` fails when the text of a PDF reads a text of the CV out of the order of the page, as applicant tracking systems would read it. Chromium paints a positioned element after the rest of its page, so no element of the CV is positioned.
- Each contact detail of a CV follows a monochrome icon of `scripts/cv/icons/`, in the plum of the site, but the LinkedIn logo, which comes from the menu of the site. The icons are hidden from screen readers and from the tags of the PDF: the text of each detail says what it is, and a spec checks that every icon draws in the color of its text.
- The [CV audit](cv-audit.md) scores the CVs as recruiters and their AI screening agents read them, before and after a change of their content or design.
- A new language needs its link preview image, the URL of its CV and the texts of its CV. A new icon needs its entry in the icon list and a layout, which a spec matches.
