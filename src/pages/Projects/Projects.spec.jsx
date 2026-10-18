import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../i18n';
import { theme } from '../../theme';
import { declaredStyle, serializeCssValue } from '../../styleTestUtils';
import { INTERACTIVE_SELECTOR, isPublicFile } from '../testUtils';
import { BACKGROUND_IMAGE_URL } from './constants';
import freelanceProjectsData from './.data/freelance-projects.json';
import personalProjectsData from './.data/personal-projects.json';
import { Projects } from './Projects';

const allProjects = [...personalProjectsData.projects, ...freelanceProjectsData.projects];
/** The straight apostrophe, which French text replaces with the typographic one (’). */
const STRAIGHT_APOSTROPHE = "'";

const TABLET_MEDIA = `(min-width: ${theme.screens.tablet})`;

/** Thumbnail of the first personal project, which the first section shows on every layout. */
const firstThumbnail = () =>
  screen.getByRole('img', { name: personalProjectsData.projects[0].name });

describe('Projects', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
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

  it.each(allProjects.map(({ name, imageUrl }) => [name, imageUrl]))(
    'serves the screenshot of %s from public/ (%s)',
    (_name, imageUrl) => {
      expect(isPublicFile(imageUrl)).toBe(true);
    },
  );

  it('serves its background from public/', () => {
    expect(isPublicFile(BACKGROUND_IMAGE_URL)).toBe(true);
  });

  it('writes the project names and types with typographic apostrophes', () => {
    const textsWithStraightApostrophe = allProjects
      .flatMap(({ name, type }) => [name, type])
      .filter(text => text.includes(STRAIGHT_APOSTROPHE));

    expect(textsWithStraightApostrophe).toEqual([]);
  });

  it('shows the chess game with its French name', () => {
    render(<Projects />);

    expect(screen.getByText('Jeu d’échecs')).toBeInTheDocument();
  });

  it.each(['Trouillet Décors', 'Y-YServicies'])(
    'shows the client %s with the spelling confirmed by the site owner',
    async name => {
      render(<Projects />);
      for (const showAllButton of screen.getAllByText(/^Tout afficher/)) {
        await userEvent.click(showAllButton);
      }

      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByRole('img', { name })).toBeInTheDocument();
    },
  );

  it('links every project that has a url, with no interactive element inside a link', async () => {
    render(<Projects />);
    for (const showAllButton of screen.getAllByText(/^Tout afficher/)) {
      await userEvent.click(showAllButton);
    }

    const links = screen.getAllByRole('link');
    const linkedProjectNames = allProjects.filter(({ url }) => url).map(({ name }) => name);
    expect(links.map(link => link.textContent)).toEqual(linkedProjectNames);
    for (const link of links) expect(link.querySelector(INTERACTIVE_SELECTOR)).toBeNull();
  });
});

describe('Projects layout on mobile', () => {
  it('lines the cards of the "Show all" rows up with the section title below the tablet width', async () => {
    render(<Projects />);

    const [showAllButton] = screen.getAllByText(/^Tout afficher/);
    await userEvent.click(showAllButton);

    const grid = firstThumbnail().closest('ul');
    const card = firstThumbnail().closest('li');
    const header = screen.getByText('Projets personnels').closest('header');
    const cardMargin = declaredStyle({ element: card, property: 'margin' });
    const gridPadding = serializeCssValue({
      property: 'padding-left',
      value: `calc(${theme.space.page} - ${cardMargin})`,
    });

    expect(cardMargin).toBe(theme.space[5]);
    expect(declaredStyle({ element: header, property: 'padding-left' })).toBe(theme.space.page);
    expect(declaredStyle({ element: grid, property: 'padding-left' })).toBe(gridPadding);
    expect(declaredStyle({ element: grid, property: 'padding-right' })).toBe(gridPadding);
  });

  it('removes the padding of the "Show all" rows from the tablet width', async () => {
    render(<Projects />);

    const [showAllButton] = screen.getAllByText(/^Tout afficher/);
    await userEvent.click(showAllButton);

    const grid = firstThumbnail().closest('ul');
    expect(declaredStyle({ element: grid, property: 'padding-left', media: TABLET_MEDIA })).toBe(
      '0px',
    );
    expect(declaredStyle({ element: grid, property: 'padding-right', media: TABLET_MEDIA })).toBe(
      '0px',
    );
  });

  it('keeps the row of cards without padding, so that it scrolls to the screen edges', () => {
    render(<Projects />);

    const grid = firstThumbnail().closest('ul');
    expect(declaredStyle({ element: grid, property: 'display' })).toBe('flex');
    expect(declaredStyle({ element: grid, property: 'padding-left' })).toBe('');
    expect(declaredStyle({ element: grid, property: 'padding-right' })).toBe('');
  });
});
