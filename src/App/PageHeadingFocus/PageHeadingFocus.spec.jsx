import { lazy, Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router';

import PageHeadingFocus from './PageHeadingFocus';

/** A page with its heading and a link to the other page. */
const Page = ({ title, linkTo }) => (
  <section>
    <h1>{title}</h1>
    <Link to={linkTo}>Go to {linkTo}</Link>
  </section>
);

/**
 * The projects page, loaded on its first visit like the lazy pages of the app. Made anew for each
 * render, so that every test waits for it.
 */
const createLazyProjects = () =>
  lazy(
    () =>
      new Promise(resolve => {
        setTimeout(() =>
          resolve({
            default: () => (
              <Page
                title="Projects"
                linkTo="/"
              />
            ),
          }),
        );
      }),
  );

/** Button outside the pages that goes back in the history, as the browser's back button. */
const BackButton = () => {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Back</button>;
};

/**
 * Renders two pages, the second one lazy, with the component after them, as in the app.
 * `useTransitions: false` makes the router show the new location at once, without waiting for
 * the page in a transition.
 */
const renderPages = ({ useTransitions } = {}) => {
  const LazyProjects = createLazyProjects();
  return render(
    <MemoryRouter useTransitions={useTransitions}>
      <BackButton />
      <Suspense fallback={null}>
        <Routes>
          <Route
            path="/"
            element={
              <Page
                title="Home"
                linkTo="/projects"
              />
            }
          />
          <Route
            path="/projects"
            element={<LazyProjects />}
          />
        </Routes>
        <PageHeadingFocus />
      </Suspense>
    </MemoryRouter>,
  );
};

describe('PageHeadingFocus', () => {
  it('renders nothing', () => {
    const { container } = render(
      <MemoryRouter>
        <PageHeadingFocus />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('leaves the focus alone on the first load', () => {
    renderPages();

    expect(screen.getByRole('heading', { name: 'Home' })).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });

  it.each([
    ['in a transition', true],
    ['at once', false],
  ])(
    'focuses the heading of a page loaded after a navigation by link %s',
    async (_case, useTransitions) => {
      renderPages({ useTransitions });

      await userEvent.click(screen.getByRole('link', { name: 'Go to /projects' }));

      expect(await screen.findByRole('heading', { name: 'Projects' })).toHaveFocus();
    },
  );

  it('focuses the heading again after each navigation', async () => {
    renderPages();
    await userEvent.click(screen.getByRole('link', { name: 'Go to /projects' }));
    await screen.findByRole('heading', { name: 'Projects' });

    await userEvent.click(screen.getByRole('link', { name: 'Go to /' }));

    expect(screen.getByRole('heading', { name: 'Home' })).toHaveFocus();
  });

  it('focuses the heading after a link to the current page', async () => {
    render(
      <MemoryRouter>
        <Page
          title="Home"
          linkTo="/"
        />
        <PageHeadingFocus />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'Go to /' }));

    expect(screen.getByRole('heading', { name: 'Home' })).toHaveFocus();
  });

  it('leaves the focus alone on the back button of the browser', async () => {
    renderPages();
    await userEvent.click(screen.getByRole('link', { name: 'Go to /projects' }));
    await screen.findByRole('heading', { name: 'Projects' });

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByRole('heading', { name: 'Home' })).not.toHaveFocus();
    expect(screen.getByRole('button', { name: 'Back' })).toHaveFocus();
  });
});
