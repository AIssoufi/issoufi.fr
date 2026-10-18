import { render, screen } from '@testing-library/react';
import { createElement } from 'react';

import Page from '../components/Page';
import { INTERACTIVE_SELECTOR, isPublicFile, readBackgroundImages } from './testUtils';

describe('INTERACTIVE_SELECTOR', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('matches the interactive content of HTML, and the focusable or editable elements', () => {
    document.body.innerHTML = `
      <a href="/projects">link</a><audio controls></audio><button>button</button>
      <details>details</details><embed /><iframe></iframe><img alt="" usemap="#map" />
      <input /><label>label</label><select></select><textarea></textarea>
      <video controls></video><div tabindex="-1">focusable</div>
      <div contenteditable="true">editable</div>`;

    const matches = [...document.querySelectorAll(INTERACTIVE_SELECTOR)].map(
      element => element.textContent || element.tagName,
    );
    expect(matches).toEqual([
      'link',
      'AUDIO',
      'button',
      'details',
      'EMBED',
      'IFRAME',
      'IMG',
      'INPUT',
      'label',
      'SELECT',
      'TEXTAREA',
      'VIDEO',
      'focusable',
      'editable',
    ]);
  });

  it('matches none of the elements that take no click nor focus', () => {
    document.body.innerHTML = `
      <a>anchor without href</a><span>text</span><img alt="" /><input type="hidden" />
      <audio></audio><video></video><div contenteditable="false">read only</div>`;

    expect(document.querySelectorAll(INTERACTIVE_SELECTOR)).toHaveLength(0);
  });
});

describe('isPublicFile', () => {
  it('takes an absolute URL naming a file of public/', () => {
    expect(isPublicFile('/robots.txt')).toBe(true);
  });

  it('does not take a missing file or a folder', () => {
    expect(isPublicFile('/missing-screenshot.webp')).toBe(false);
    expect(isPublicFile('')).toBe(false);
    expect(isPublicFile('/')).toBe(false);
  });

  it('only takes absolute URLs that stay inside public/', () => {
    expect(isPublicFile('robots.txt')).toBe(false);
    expect(isPublicFile('/../package.json')).toBe(false);
    expect(isPublicFile(undefined)).toBe(false);
    expect(isPublicFile(null)).toBe(false);
    expect(isPublicFile(42)).toBe(false);
  });
});

describe('readBackgroundImages', () => {
  it('reads the whole photo and the portrait version that a page shows', () => {
    const backgroundPhoto = { url: '/home.webp', portraitUrl: '/home-portrait.webp' };
    render(createElement(Page, { backgroundPhoto }));

    expect(readBackgroundImages(screen.getByRole('main'))).toEqual({
      image: 'url("/home.webp")',
      portraitImage: 'url("/home-portrait.webp")',
    });
  });

  it('reads no image for a page without a photo', () => {
    render(createElement(Page));

    expect(readBackgroundImages(screen.getByRole('main'))).toEqual({
      image: 'none',
      portraitImage: 'none',
    });
  });

  it.each([
    ['an element without styles', () => document.createElement('main')],
    ['no element', () => undefined],
  ])('reads empty values for %s', (_, getElement) => {
    expect(readBackgroundImages(getElement())).toEqual({ image: '', portraitImage: '' });
  });
});
