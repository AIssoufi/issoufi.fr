import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../i18n';
import { LANGUAGES } from '../../i18n/constants';
import { fr } from '../../i18n/fr';
import { theme } from '../../theme';
import { declaredStyle, serializeCssValue } from '../../styleTestUtils';
import { INTERACTIVE_SELECTOR, isPublicFile } from '../testUtils';
import { BACKGROUND_IMAGE_URL } from './constants';
import freelanceProjectsData from './.data/freelance-projects.json';
import personalProjectsData from './.data/personal-projects.json';
import { Projects } from './Projects';

const allProjects = [...personalProjectsData.projects, ...freelanceProjectsData.projects];

/** Name and kind of each card of the page in French, in the order of the page. */
const FRENCH_CARDS = [
  ['Jeu d’échecs', 'Application web'],
  ['Magasin de plugins audio', 'Application web'],
  ['Puissance 4', 'Application web'],
  ['Calculatrice', 'Application web'],
  ['Study SARL', 'Site web'],
  ['Kane Riviera Transfert', 'Application web'],
  ['Trouillet Décors', 'Site vitrine'],
  ['Y-YServicies', 'Site vitrine'],
  ['Cadeaux de naissance', 'Site vitrine'],
];

/** Name and kind of each card of the page in English: translated, except the client names. */
const ENGLISH_CARDS = [
  ['Chess game', 'Web application'],
  ['Audio plugin store', 'Web application'],
  ['Connect Four', 'Web application'],
  ['Calculator', 'Web application'],
  ['Study SARL', 'Website'],
  ['Kane Riviera Transfert', 'Web application'],
  ['Trouillet Décors', 'Brochure website'],
  ['Y-YServicies', 'Brochure website'],
  ['Baby gifts', 'Brochure website'],
];

/** A text that holds more than whitespace. */
const FILLED_TEXT = /\S/;

const TABLET_MEDIA = `(min-width: ${theme.screens.tablet})`;

/** Thumbnail of the first personal project, which the first section shows on every layout. */
const firstThumbnail = () =>
  screen.getByRole('img', { name: fr.projects.names[personalProjectsData.projects[0].nameKey] });

/** Clicks "Show all" in every section, so that each row shows all its cards. */
const showAllProjects = async () => {
  for (const showAllButton of screen.getAllByText(/^Tout afficher/)) {
    await userEvent.click(showAllButton);
  }
};

/** French or English accessible name of a like button, which starts with the action. */
const LIKE_BUTTON_NAME = /^(Aimer|Like) /;

/** Like buttons of every card that the page shows. */
const likeButtons = () => screen.getAllByRole('button', { name: LIKE_BUTTON_NAME });

describe('Projects', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
    localStorage.clear();
  });

  it('renders the personal and freelance sections', () => {
    render(<Projects />);

    expect(screen.getByText('Projets personnels')).toBeInTheDocument();
    expect(screen.getByText('Projets freelance')).toBeInTheDocument();
  });

  it('has a single main landmark and a single level 1 heading', () => {
    render(<Projects />);

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('titles the page for screen readers, and each section with a level 2 heading', () => {
    render(<Projects />);
    const sectionTitles = screen.getAllByRole('heading', { level: 2 });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Projets');
    expect(sectionTitles.map(title => title.textContent)).toEqual([
      'Projets personnels',
      'Projets freelance',
    ]);
  });

  it('names the page in English once the language changes', async () => {
    render(<Projects />);

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Projects');
  });

  it('hides the page title from the screen, out of the flow of the sections', () => {
    render(<Projects />);
    const pageTitle = screen.getByRole('heading', { level: 1 });
    const style = property => declaredStyle({ element: pageTitle, property });

    expect(style('position')).toBe('absolute');
    expect(style('width')).toBe('1px');
    expect(style('height')).toBe('1px');
    expect(style('overflow')).toBe('hidden');
    expect(style('clip-path')).toBe('inset(50%)');
  });

  it.each(allProjects.map(({ nameKey, imageUrl }) => [nameKey, imageUrl]))(
    'serves the screenshot of %s from public/ (%s)',
    (_nameKey, imageUrl) => {
      expect(isPublicFile(imageUrl)).toBe(true);
    },
  );

  it('serves its background from public/', () => {
    expect(isPublicFile(BACKGROUND_IMAGE_URL)).toBe(true);
  });

  it.each(
    LANGUAGES.flatMap(language =>
      allProjects.map(({ nameKey, typeKey }) => [language, nameKey, typeKey]),
    ),
  )(
    'translates into %s the name %s and the kind %s of the project',
    (language, nameKey, typeKey) => {
      for (const key of [`projects.names.${nameKey}`, `projects.types.${typeKey}`]) {
        // Read without the fallback to French, which would hide a missing text
        const text = i18n.getResource(language, 'translation', key);

        expect(text, `${key} in ${language}`).toMatch(FILLED_TEXT);
      }
    },
  );

  it.each([
    ['fr', FRENCH_CARDS],
    ['en', ENGLISH_CARDS],
  ])('shows the name and the kind of every card in %s', async (language, expectedCards) => {
    render(<Projects />);
    await showAllProjects();
    await act(() => i18n.changeLanguage(language));

    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(expectedCards.length);
    expectedCards.forEach(([name, type], index) => {
      expect(within(cards[index]).getByRole('img', { name })).toBeInTheDocument();
      expect(within(cards[index]).getByText(type)).toBeInTheDocument();
    });
  });

  it.each(['Trouillet Décors', 'Y-YServicies'])(
    'shows the client %s with the spelling confirmed by the site owner',
    async name => {
      render(<Projects />);
      await showAllProjects();

      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByRole('img', { name })).toBeInTheDocument();
    },
  );

  it('gives every project of the page its own integer id, which keys its like in the storage', () => {
    const ids = allProjects.map(({ id }) => id);

    for (const id of ids) expect(Number.isInteger(id), `id ${id}`).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(LANGUAGES)(
    'likes no project and shows no count on a first visit, in %s',
    async language => {
      render(<Projects />);
      await showAllProjects();
      await act(() => i18n.changeLanguage(language));

      expect(likeButtons()).toHaveLength(allProjects.length);
      for (const likeButton of likeButtons()) {
        expect(likeButton).toHaveAttribute('aria-pressed', 'false');
        expect(likeButton).toHaveTextContent(/^$/);
      }
    },
  );

  it('likes a personal project without liking the freelance project in the same place, after a reload', async () => {
    /** First like button of each section, the personal one then the freelance one. */
    const firstLikeOfEachSection = () =>
      screen
        .getAllByRole('list')
        .map(list => within(list).getAllByRole('button', { name: LIKE_BUTTON_NAME })[0]);
    const { unmount } = render(<Projects />);
    await userEvent.click(firstLikeOfEachSection()[0]);
    unmount();

    render(<Projects />);
    const [firstPersonalLike, firstFreelanceLike] = firstLikeOfEachSection();

    expect(firstPersonalLike).toHaveAccessibleName(`Aimer ${FRENCH_CARDS[0][0]}`);
    expect(firstPersonalLike).toHaveAttribute('aria-pressed', 'true');
    expect(firstFreelanceLike).toHaveAccessibleName(`Aimer ${FRENCH_CARDS[4][0]}`);
    expect(firstFreelanceLike).toHaveAttribute('aria-pressed', 'false');
  });

  it('links every project that has a url, with no interactive element inside a link', async () => {
    render(<Projects />);
    await showAllProjects();

    const links = screen.getAllByRole('link');
    const linkedProjectNames = allProjects
      .filter(({ url }) => url)
      .map(({ nameKey }) => fr.projects.names[nameKey]);
    expect(links.map(link => link.textContent)).toEqual(linkedProjectNames);
    for (const link of links) expect(link.querySelector(INTERACTIVE_SELECTOR)).toBeNull();
  });
});

/** Layouts of the cards of a section: the row, then every card after "Show all". */
const CARD_LAYOUTS = [
  ['the row', { isShowingAll: false }],
  ['the "Show all" rows', { isShowingAll: true }],
];

/** Shows every card of the first section when `isShowingAll` is true, the row otherwise. */
const showCardLayout = async ({ isShowingAll }) => {
  if (!isShowingAll) return;

  const [showAllButton] = screen.getAllByText(/^Tout afficher/);
  await userEvent.click(showAllButton);
};

describe('Projects layout on mobile', () => {
  it.each(CARD_LAYOUTS)(
    'lines the cards of %s up with the section title below the tablet width',
    async (_layout, layout) => {
      render(<Projects />);
      await showCardLayout(layout);

      const grid = firstThumbnail().closest('ul');
      const card = firstThumbnail().closest('li');
      const header = screen.getByText('Projets personnels').closest('header');
      const cardMargin = declaredStyle({ element: card, property: 'margin' });
      const gridPadding = serializeCssValue({
        property: 'padding-left',
        value: `calc(${theme.space.page} - ${cardMargin})`,
      });

      expect(cardMargin).toBe(theme.space['project-card-margin']);
      expect(declaredStyle({ element: header, property: 'padding-left' })).toBe(theme.space.page);
      expect(declaredStyle({ element: grid, property: 'padding-left' })).toBe(gridPadding);
      expect(declaredStyle({ element: grid, property: 'padding-right' })).toBe(gridPadding);
      // Padded by the list, not by its first and last cards, which would be wider than the others
      for (const property of ['padding-left', 'padding-right']) {
        expect(declaredStyle({ element: card, property, pseudo: ':first-child' })).toBe('');
        expect(declaredStyle({ element: card, property, pseudo: ':last-child' })).toBe('');
      }
    },
  );

  it.each(CARD_LAYOUTS)(
    'removes the padding of %s from the tablet width',
    async (_layout, layout) => {
      render(<Projects />);
      await showCardLayout(layout);

      const grid = firstThumbnail().closest('ul');
      expect(declaredStyle({ element: grid, property: 'padding-left', media: TABLET_MEDIA })).toBe(
        '0px',
      );
      expect(declaredStyle({ element: grid, property: 'padding-right', media: TABLET_MEDIA })).toBe(
        '0px',
      );
    },
  );

  it('leaves room on the right for the controls floating on the right edge from the tablet width', () => {
    render(<Projects />);

    const page = screen.getByRole('main');
    expect(declaredStyle({ element: page, property: 'padding-left', media: TABLET_MEDIA })).toBe(
      theme.space.page,
    );
    expect(declaredStyle({ element: page, property: 'padding-right', media: TABLET_MEDIA })).toBe(
      theme.space['floating-controls-room'],
    );
  });

  it('lets the row of cards span the screen, so that it scrolls to the screen edges', () => {
    render(<Projects />);

    // The padding of the list is inside the box it scrolls, unlike a padding of the page
    const page = screen.getByRole('main');
    const grid = firstThumbnail().closest('ul');
    expect(declaredStyle({ element: page, property: 'padding-left' })).toBe('0px');
    expect(declaredStyle({ element: page, property: 'padding-right' })).toBe('0px');
    expect(declaredStyle({ element: grid, property: 'display' })).toBe('flex');
    expect(declaredStyle({ element: grid, property: 'overflow-x' })).toBe('auto');
  });
});
