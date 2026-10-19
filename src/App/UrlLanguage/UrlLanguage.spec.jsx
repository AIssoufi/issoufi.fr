import { act, cleanup, render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';

import i18n from '../../i18n/index.ts';
import UrlLanguage from './UrlLanguage.tsx';

/** Text translated in the current language, rendered next to the component as a page would. */
const ProjectsLink = () => {
  const { t } = useTranslation();
  return <span>{t('nav.projects')}</span>;
};

/** Renders the component in a router opened at a path, and returns the router to navigate. */
const renderAt = path => {
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <>
            <UrlLanguage />
            <ProjectsLink />
          </>
        ),
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

describe('UrlLanguage', () => {
  afterEach(async () => {
    // Unmounts first, or the component would bring back the language of its URL
    cleanup();
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders nothing', () => {
    const { container } = render(
      <RouterProvider router={createMemoryRouter([{ path: '*', element: <UrlLanguage /> }])} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it.each(['/en/', '/en/projects', '/en/page-inconnue'])(
    'switches to English at the English URL %s',
    path => {
      renderAt(path);

      expect(i18n.language).toBe('en');
      expect(screen.getByText('Projects')).toBeInTheDocument();
    },
  );

  it('switches back to French at a French URL', async () => {
    await act(() => i18n.changeLanguage('en'));

    renderAt('/projects');

    expect(i18n.language).toBe('fr');
    expect(screen.getByText('Projets')).toBeInTheDocument();
  });

  it('follows the language of the URL on each navigation, back and forward included', async () => {
    const router = renderAt('/projects');

    await act(() => router.navigate('/en/projects'));
    expect(screen.getByText('Projects')).toBeInTheDocument();

    await act(() => router.navigate(-1));
    expect(screen.getByText('Projets')).toBeInTheDocument();

    await act(() => router.navigate(1));
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('brings back the language of the URL when the language changes otherwise', async () => {
    renderAt('/en/projects');

    await act(() => i18n.changeLanguage('fr'));

    expect(i18n.language).toBe('en');
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });
});
