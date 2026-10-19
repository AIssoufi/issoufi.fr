import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import i18n from '../../i18n';
import DocumentMeta from './DocumentMeta';

const renderAt = path =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <DocumentMeta />
    </MemoryRouter>,
  );

const description = () =>
  document.querySelector('meta[name="description"]').getAttribute('content');

describe('DocumentMeta', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 17));
    document.head.innerHTML = '<meta name="description" content="" />';
  });

  afterEach(async () => {
    vi.useRealTimers();
    await act(() => i18n.changeLanguage('fr'));
  });

  it('sets the home page metadata with the years of experience', () => {
    renderAt('/');

    expect(document.documentElement.lang).toBe('fr');
    expect(document.title).toBe('ADAM Issoufi - Développeur full-stack JavaScript');
    expect(description()).toBe(
      'Développeur full-stack JavaScript avec 8 ans d’expérience, spécialisé React.',
    );
  });

  it('sets the metadata of the current page', () => {
    renderAt('/projects');

    expect(document.title).toBe('Projets - ADAM Issoufi');
    expect(description()).toBe(
      'Projets personnels et freelance d’ADAM Issoufi, développeur full-stack JavaScript.',
    );
  });

  it('sets the not found metadata for unknown pages', () => {
    renderAt('/skills');

    expect(document.title).toBe('Page introuvable - ADAM Issoufi');
    expect(description()).toBe('Cette page n’existe pas.');
  });

  it.each([
    ['/en/projects', 'Projects - ADAM Issoufi'],
    ['/en/', 'ADAM Issoufi - Full-stack JavaScript Developer'],
    ['/en/skills', 'Page not found - ADAM Issoufi'],
  ])('finds the page of the English URL %s', async (path, title) => {
    renderAt(path);
    await act(() => i18n.changeLanguage('en'));

    expect(document.title).toBe(title);
  });

  it('follows the language', async () => {
    renderAt('/');
    await act(() => i18n.changeLanguage('en'));

    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('ADAM Issoufi - Full-stack JavaScript Developer');
    expect(description()).toBe(
      'Full-stack JavaScript developer with 8 years of experience, specializing in React.',
    );
  });

  describe('link to the web app manifest', () => {
    const manifestUrl = () => document.querySelector('link[rel="manifest"]').getAttribute('href');

    beforeEach(() => {
      document.head.innerHTML =
        '<meta name="description" content="" /><link rel="manifest" href="/manifest.webmanifest" />';
    });

    it('links the manifest of the language of the page', () => {
      renderAt('/projects');

      expect(manifestUrl()).toBe('/manifest.webmanifest');
    });

    it('links the manifest of the language that the toggle moves to, and back', async () => {
      renderAt('/en/projects');
      await act(() => i18n.changeLanguage('en'));

      expect(manifestUrl()).toBe('/en/manifest.webmanifest');

      await act(() => i18n.changeLanguage('fr'));

      expect(manifestUrl()).toBe('/manifest.webmanifest');
    });

    it('adds no link to a page without one, as in the standalone build', async () => {
      document.head.innerHTML = '<meta name="description" content="" />';
      renderAt('/en/');
      await act(() => i18n.changeLanguage('en'));

      expect(document.querySelector('link[rel="manifest"]')).toBeNull();
      expect(document.title).toBe('ADAM Issoufi - Full-stack JavaScript Developer');
    });
  });
});
