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

  it('follows the language', async () => {
    renderAt('/');
    await act(() => i18n.changeLanguage('en'));

    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('ADAM Issoufi - Full-stack JavaScript Developer');
    expect(description()).toBe(
      'Full-stack JavaScript developer with 8 years of experience, specializing in React.',
    );
  });
});
