# Fonts of the CV

`pnpm cv` prints the CV in these static instances of Montserrat, the body font of the site (`fonts.body` in `src/theme/theme.ts`), so that it needs no network and Chromium embeds them in the PDF as TrueType fonts, whose text every reader can select and search. The variable font that the site loads in browsers would become Type 3 fonts in the PDF, which Preview and Safari can neither select nor search.

| File                     | Weight | SHA-256                                                            |
| ------------------------ | ------ | ------------------------------------------------------------------ |
| `Montserrat-Regular.ttf` | 400    | `84f3d3275dfb159dd311c61828fd754a82ec31c377120518e2cd3e7d34394e96` |
| `Montserrat-Medium.ttf`  | 500    | `637639da93fdd9178e52662cce4bd5a59a544eb60677bb6ef9f89bc472607e5d` |
| `Montserrat-Bold.ttf`    | 700    | `247f052d2f5b84a5bbe7831c3b08a71ca391ff54f1dfb9be88a3d3da569e3a38` |

## Source

- Font: Montserrat, version 9.000 (name table of each file), by [the Montserrat Project Authors](https://github.com/JulietaUla/Montserrat).
- Files: the static TrueType files that the Google Fonts API serves to a client it does not know as a browser, release `v31` of its Montserrat files, downloaded on 18 October 2026 from `https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700`:
  - `https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf` (400)
  - `https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtZ6Ew-.ttf` (500)
  - `https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf` (700)
- They hold every character of the font, such as the arrows, which the `latin` subsets of Google Fonts lack.

## License

Montserrat is licensed under the SIL Open Font License, version 1.1: see `OFL.txt`, from [the Montserrat folder of google/fonts](https://github.com/google/fonts/tree/main/ofl/montserrat). The license must stay next to the files.

These files are not served by the site: they are outside `public/`, so neither `dist/` nor the standalone build of the releases holds them. Only the PDFs embed a subset of them.

To use other weights, add their files here with their source and hash, and their weight names to `CV_FONT_FILES` (`scripts/cv/constants.mjs`).
