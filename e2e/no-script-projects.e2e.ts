import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { en } from '../src/i18n/en.ts';
import { fr } from '../src/i18n/fr.ts';
import type { Language, Translations } from '../src/i18n/types.ts';
import { localizePath } from '../src/i18n/utils.ts';
import freelanceProjectsData from '../src/pages/Projects/.data/freelance-projects.json' with { type: 'json' };
import personalProjectsData from '../src/pages/Projects/.data/personal-projects.json' with { type: 'json' };
import { NO_SCRIPT_SCREENS, PROJECTS_ROUTE } from './constants.ts';

/** Translations of each language, to find the sections, cards and buttons by their names. */
const TRANSLATIONS = { fr, en } satisfies Record<Language, Translations>;

/** Sections of the Projects page: the key of their title, and their projects, in order. */
const SECTIONS = [
  { titleKey: 'personal', projects: personalProjectsData.projects },
  { titleKey: 'freelance', projects: freelanceProjectsData.projects },
] as const;

// A visitor who turned JavaScript off, or a crawler that runs none, gets the page that the build
// rendered, whose arrows and "Show all" would do nothing
test.use({ javaScriptEnabled: false });

for (const { width, height } of NO_SCRIPT_SCREENS) {
  test.describe(`with JavaScript off, on a ${width} px wide screen`, () => {
    test.use({ viewport: { width, height } });

    for (const language of LANGUAGES) {
      const texts = TRANSLATIONS[language].projects;
      // The data names each project by its key in these texts
      const projectNames = new Map<string, string>(Object.entries(texts.names));
      const route = localizePath({ path: PROJECTS_ROUTE, language });

      for (const { titleKey, projects } of SECTIONS) {
        const title = texts[titleKey];

        test(`${route} shows every project of "${title}", and no button of its row`, async ({
          page,
        }) => {
          await page.goto(route);
          const section = page.locator('section', {
            has: page.getByRole('heading', { level: 2, name: title }),
          });
          // The list of cards, before the list of tools of each card
          const list = section.getByRole('list').first();

          // Every card shows by scrolling the page alone, as the list does not scroll sideways
          const listWidths = await list.evaluate(element => ({
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          }));
          expect(listWidths.scrollWidth, 'width of the cards in px').toBe(listWidths.clientWidth);
          for (const { nameKey } of projects) {
            const name = projectNames.get(nameKey) ?? '';
            const heading = section.getByRole('heading', { level: 3, name });
            await expect(heading).toBeVisible();
            await heading.scrollIntoViewIfNeeded();
            await expect(heading).toBeInViewport();
          }

          const buttonNames = [
            texts.previousPage,
            texts.nextPage,
            texts.showAll.replace('{{count}}', String(projects.length)),
          ];
          // In the HTML of the build, but hidden: a button missing or renamed would pass unseen
          for (const name of buttonNames) {
            const button = section.getByRole('button', { name, includeHidden: true });
            await expect(button).toHaveCount(1);
            await expect(button).toBeHidden();
          }
        });
      }
    }
  });
}
