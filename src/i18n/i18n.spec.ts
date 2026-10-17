import { readFileSync } from 'node:fs';

import i18n from '.';
import { en } from './en';
import { fr } from './fr';

describe('document metadata', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 17));
    document.head.innerHTML = '<meta name="description" content="" />';
  });

  afterEach(async () => {
    vi.useRealTimers();
    await i18n.changeLanguage('fr');
  });

  it('switches lang, title and description to English', async () => {
    await i18n.changeLanguage('en');

    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe(en.meta.title);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Full-stack JavaScript developer with 8 years of experience, specializing in React.',
    );
  });

  it('switches lang, title and description back to French', async () => {
    await i18n.changeLanguage('en');
    await i18n.changeLanguage('fr');

    expect(document.documentElement.lang).toBe('fr');
    expect(document.title).toBe(fr.meta.title);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      "Développeur full-stack JavaScript avec 8 ans d'expérience, spécialisé React.",
    );
  });
});

describe('index.html', () => {
  const html = readFileSync('index.html', 'utf-8');

  it('uses the French title from the translations', () => {
    expect(html).toContain(`<title>${fr.meta.title}</title>`);
    expect(html.split(`content="${fr.meta.title}"`)).toHaveLength(3);
  });

  it('uses the French description from the translations', () => {
    const description = fr.meta.description.replace('{{years}}', '%YEARS_OF_EXPERIENCE%');

    expect(html.split(`content="${description}"`)).toHaveLength(4);
  });
});
