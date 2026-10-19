import { act } from '@testing-library/react';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { prerender } from 'react-dom/static';

import App from './App/App.tsx';
import { DEFAULT_LANGUAGE } from './i18n/constants.ts';
import i18n from './i18n/index.ts';
import { localizePath } from './i18n/utils.ts';
import freelanceProjects from './pages/Projects/.data/freelance-projects.json';
import personalProjects from './pages/Projects/.data/personal-projects.json';
import { fr } from './i18n/fr.ts';
import { BUILD_MONTH_START } from './pages/Experiences/JobSummary/hooks/useToday/constants.ts';
import { computeDuration, formatDuration } from './pages/Experiences/utils/duration.ts';
import { LIKED_PROJECTS_STORAGE_KEY } from './pages/Projects/Project/constants.ts';
import { prerenderPage } from './prerender.tsx';
import { getNotFoundFiles, getPageFiles } from './utils/pages.ts';

/**
 * Date of the visitor, a year and two months after the build, so that the durations up to "today"
 * that the browser computes differ from those of the page that the build rendered.
 */
const VISITOR_DATE = new Date(
  BUILD_MONTH_START.getFullYear() + 1,
  BUILD_MONTH_START.getMonth() + 2,
  15,
);

/** Duration of the current job of the French experiences page up to `today`, as it shows it. */
const getCurrentJobDuration = today =>
  formatDuration({
    duration: computeDuration({
      startDate: fr.exp.sewanLead.start,
      endDate: fr.exp.sewanLead.end,
      today,
    }),
    t: i18n.getFixedT('fr'),
  });

/** Ids of every project, which the visitor liked on a previous visit. */
const ALL_PROJECT_IDS = [...freelanceProjects.projects, ...personalProjects.projects].map(
  ({ id }) => id,
);

/** Error that the projects page throws while `failure.error` holds it, for the failing renders. */
const failure = vi.hoisted(() => ({ error: undefined }));

vi.mock('./pages/Projects/Projects.tsx', async importOriginal => {
  const original = await importOriginal();
  /** The projects page, or the error of `failure` thrown in its place. */
  const Projects = () => {
    if (failure.error) throw failure.error;
    return <original.Projects />;
  };
  return { ...original, Projects };
});

/** Path of no page, which Cloudflare Pages answers with the not found page of its language. */
const UNKNOWN_PATH = '/page-inconnue';

/** Tells whether React took over a node of the page when it hydrated it: it then holds a fiber. */
const isHydratedNode = node =>
  node !== null && Object.keys(node).some(key => key.startsWith('__reactFiber$'));

/**
 * Warning of React in development when the browser renders a context that the build rendered in
 * the same process, as only a test does: both renderers mark the contexts that they render.
 */
const MULTIPLE_RENDERERS_WARNING = 'Detected multiple renderers concurrently rendering';

/**
 * Renders nothing with the renderer of `prerender`, which gives the contexts that the last page
 * left set, such as that of the router, their default values back: it only does so when it renders
 * again, in a process that never renders in the browser too.
 */
const resetServerContexts = () => prerender(null);

/** Root of the page that the last test hydrated, unmounted after it, even when it fails. */
let hydratedRoot;

/**
 * Messages that React logged through `consoleError`, a spy of `console.error`, while it hydrated a
 * page, but the warning of the test itself: it warns of an element or an attribute that differs,
 * which it does not repair.
 */
const getHydrationWarnings = consoleError =>
  consoleError.mock.calls
    .map(data => data.join(' '))
    .filter(warning => !warning.includes(MULTIPLE_RENDERERS_WARNING));

/**
 * Hydrates `html`, the page that the build rendered at `path`, with the app at that path, as the
 * browser of a visitor does, a visitor who liked every project and visits after the month of the
 * build, and collects the errors that React recovers from, such as a text that differs.
 */
const hydratePage = async ({ path, html }) => {
  await resetServerContexts();
  localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, JSON.stringify(ALL_PROJECT_IDS));
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(VISITOR_DATE);
  window.history.replaceState(null, '', path);
  const container = document.body.appendChild(document.createElement('div'));
  container.innerHTML = html;
  const recoverableErrors = [];
  await act(async () => {
    hydratedRoot = hydrateRoot(
      container,
      <StrictMode>
        <App />
      </StrictMode>,
      { onRecoverableError: error => recoverableErrors.push(error) },
    );
  });
  return { container, recoverableErrors };
};

describe('prerenderPage', () => {
  afterEach(async () => {
    act(() => hydratedRoot?.unmount());
    hydratedRoot = undefined;
    vi.useRealTimers();
    localStorage.clear();
    failure.error = undefined;
    window.history.replaceState(null, '', '/');
    await i18n.changeLanguage(DEFAULT_LANGUAGE);
    document.body.replaceChildren();
  });

  describe.each(getPageFiles())('at $path', ({ path, language }) => {
    it('renders the page, its lazily loaded part included, in the language of its path', async () => {
      const { html } = await prerenderPage(path);
      const container = document.createElement('div');
      container.innerHTML = html;

      expect(container.querySelectorAll('main')).toHaveLength(1);
      expect(container.querySelectorAll('h1')).toHaveLength(1);
      expect(i18n.language).toBe(language);
      // Every boundary in place, with no script to move it there, which the policy would block
      expect(html).not.toContain('<script');
      expect(html).not.toContain('<template');
    });

    it('collects the styles that the page uses, without the links that preload its images', async () => {
      const { html, styleTags } = await prerenderPage(path);

      expect(styleTags).toMatch(/^<style data-styled="true"/);
      expect(html).not.toMatch(/^<link/);
    });

    it('hydrates in the browser at its path without a difference, keeping its elements', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { html } = await prerenderPage(path);
      const { container, recoverableErrors } = await hydratePage({ path, html });
      const main = container.querySelector('main');

      await vi.waitFor(() => expect(isHydratedNode(container.querySelector('main'))).toBe(true));

      expect(container.querySelector('main')).toBe(main);
      expect(recoverableErrors).toEqual([]);
      expect(getHydrationWarnings(consoleError)).toEqual([]);
    });
  });

  it('shows the likes of the visitor once the projects page is hydrated, none before', async () => {
    const { html } = await prerenderPage('/projects');

    const { container } = await hydratePage({ path: '/projects', html });

    /** The like buttons of the cards that the page shows, the only toggle buttons of its main. */
    const getLikeButtons = () => [...container.querySelectorAll('main [aria-pressed]')];
    const page = document.createElement('div');
    page.innerHTML = html;
    expect(page.querySelectorAll('main [aria-pressed="false"]')).not.toHaveLength(0);
    expect(page.querySelectorAll('main [aria-pressed="true"]')).toHaveLength(0);
    await vi.waitFor(() => {
      expect(getLikeButtons()).not.toHaveLength(0);
      getLikeButtons().forEach(button => expect(button).toHaveAttribute('aria-pressed', 'true'));
    });
  });

  it('counts the durations to the month of the build, then to the date of the visitor', async () => {
    const { html } = await prerenderPage('/experiences');
    const [buildDuration, visitorDuration] = [BUILD_MONTH_START, VISITOR_DATE].map(
      getCurrentJobDuration,
    );

    const { container } = await hydratePage({ path: '/experiences', html });

    expect(buildDuration).not.toBe(visitorDuration);
    expect(html).toContain(buildDuration);
    await vi.waitFor(() => expect(container.textContent).toContain(visitorDuration));
  });

  describe.each(getNotFoundFiles())('at $path, the not found page', ({ path, language }) => {
    it('renders the not found page, which names no path', async () => {
      const { html } = await prerenderPage(path);

      expect(html).toContain('404');
      expect(html).not.toContain(path);
    });

    it('hydrates without a difference at a path of no page, which it answers', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { html } = await prerenderPage(path);
      const { container, recoverableErrors } = await hydratePage({
        path: localizePath({ path: UNKNOWN_PATH, language }),
        html,
      });

      await vi.waitFor(() => expect(isHydratedNode(container.querySelector('main'))).toBe(true));

      expect(recoverableErrors).toEqual([]);
      expect(getHydrationWarnings(consoleError)).toEqual([]);
    });
  });

  it('throws the first error of a page that fails to render, rather than write it', async () => {
    failure.error = new Error('The projects failed to render');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(prerenderPage('/projects')).rejects.toThrow('The projects failed to render');
  });
});
