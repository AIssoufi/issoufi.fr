import { existsSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { render, screen } from '@testing-library/react';

import freelanceProjectsData from './.data/freelance-projects.json';
import personalProjectsData from './.data/personal-projects.json';
import { Projects } from './Projects';

/** Folder whose files are served at the root of the site. */
const PUBLIC_DIR = 'public';

const allProjects = [...personalProjectsData.projects, ...freelanceProjectsData.projects];

/** Whether an absolute URL such as `/chess.webp` names a file of `public/`, not a folder. */
const isPublicFile = url => {
  const isAbsoluteUrl = typeof url === 'string' && url.startsWith('/');
  if (!isAbsoluteUrl) return false;

  const path = join(PUBLIC_DIR, url);
  // join() resolves `..`, which could leave public/
  const isInsidePublicDir = path.startsWith(`${PUBLIC_DIR}${sep}`);
  return isInsidePublicDir && existsSync(path) && statSync(path).isFile();
};

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

  it('does not take a missing file or a folder for a screenshot', () => {
    expect(isPublicFile('/missing-screenshot.webp')).toBe(false);
    expect(isPublicFile('')).toBe(false);
    expect(isPublicFile('/')).toBe(false);
  });

  it('only takes absolute URLs that stay inside public/ for a screenshot', () => {
    expect(isPublicFile('chess.webp')).toBe(false);
    expect(isPublicFile('/../package.json')).toBe(false);
    expect(isPublicFile(undefined)).toBe(false);
    expect(isPublicFile(null)).toBe(false);
    expect(isPublicFile(42)).toBe(false);
  });
});
