import { render, screen } from '@testing-library/react';

import { isPublicFile } from '../testUtils';
import { BACKGROUND_IMAGE_URL } from './constants';
import freelanceProjectsData from './.data/freelance-projects.json';
import personalProjectsData from './.data/personal-projects.json';
import { Projects } from './Projects';

const allProjects = [...personalProjectsData.projects, ...freelanceProjectsData.projects];

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
      .filter(text => text.includes("'"));

    expect(textsWithStraightApostrophe).toEqual([]);
    render(<Projects />);
    expect(screen.getByText('Jeu d’échecs')).toBeInTheDocument();
  });
});
