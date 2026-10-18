import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@xstyled/styled-components';

import { theme } from '../../theme';
import { declaredStyle, isPublicFile } from '../testUtils';
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
  it('renders the personal and freelance sections', () => {
    render(<Projects />);

    expect(screen.getByText('Projets personnels')).toBeInTheDocument();
    expect(screen.getByText('Projets freelance')).toBeInTheDocument();
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
});

describe('Projects layout on mobile', () => {
  const renderWithTheme = () =>
    render(
      <ThemeProvider theme={theme}>
        <Projects />
      </ThemeProvider>,
    );

  it('lines the cards of the "Show all" grid up with the section title below the tablet width', async () => {
    renderWithTheme();

    const [showAllButton] = screen.getAllByText(/^Tout afficher/);
    await userEvent.click(showAllButton);

    const grid = firstThumbnail().closest('main');
    const card = firstThumbnail().closest('main > *');
    const header = screen.getByText('Projets personnels').closest('header');
    const cardMargin = declaredStyle({ element: card, property: 'margin' });
    const gridPadding = `calc(${theme.space.page} - ${cardMargin})`;

    expect(cardMargin).toBe(theme.space[5]);
    expect(declaredStyle({ element: header, property: 'padding-left' })).toBe(theme.space.page);
    expect(declaredStyle({ element: grid, property: 'padding-left' })).toBe(gridPadding);
    expect(declaredStyle({ element: grid, property: 'padding-right' })).toBe(gridPadding);
  });

  it('removes the padding of the "Show all" grid from the tablet width', async () => {
    renderWithTheme();

    const [showAllButton] = screen.getAllByText(/^Tout afficher/);
    await userEvent.click(showAllButton);

    const grid = firstThumbnail().closest('main');
    expect(declaredStyle({ element: grid, property: 'padding-left', media: TABLET_MEDIA })).toBe(
      '0',
    );
    expect(declaredStyle({ element: grid, property: 'padding-right', media: TABLET_MEDIA })).toBe(
      '0',
    );
  });

  it('keeps the row of cards without padding, so that it scrolls to the screen edges', () => {
    renderWithTheme();

    const grid = firstThumbnail().closest('main');
    expect(declaredStyle({ element: grid, property: 'display' })).toBe('flex');
    expect(declaredStyle({ element: grid, property: 'padding-left' })).toBe('');
    expect(declaredStyle({ element: grid, property: 'padding-right' })).toBe('');
  });
});
