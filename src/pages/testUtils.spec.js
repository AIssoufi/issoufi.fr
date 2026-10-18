import { getReadText, INTERACTIVE_SELECTOR, isPublicFile } from './testUtils';

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

describe('getReadText', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  /** Writes some HTML in the page and returns its first element. */
  const renderHtml = html => {
    document.body.innerHTML = html;
    return document.body.firstElementChild;
  };

  it('reads the text without the parts hidden from screen readers, and keeps the element', () => {
    const period = renderHtml(
      '<p><span>août 2021</span> <span aria-hidden="true">↓</span><span>à</span> <span>Aujourd’hui</span></p>',
    );

    expect(getReadText(period)).toBe('août 2021 à Aujourd’hui');
    expect(period.textContent).toBe('août 2021 ↓à Aujourd’hui');
  });

  it('collapses the runs of white space, line breaks included, and trims them', () => {
    const element = renderHtml('<p>\n  sept. 2019 \n\t juin 2021  </p>');

    expect(getReadText(element)).toBe('sept. 2019 juin 2021');
  });

  it('reads the parts whose aria-hidden is not true', () => {
    const element = renderHtml(
      '<p><span aria-hidden="false">mai 2017</span> <span aria-hidden="">août 2017</span></p>',
    );

    expect(getReadText(element)).toBe('mai 2017 août 2017');
  });

  it('reads nothing in an element hidden from screen readers, or inside one', () => {
    const element = renderHtml('<p aria-hidden="true"><span>›</span></p>');

    expect(getReadText(element)).toBe('');
    expect(getReadText(element.firstElementChild)).toBe('');
  });

  it('reads nothing in an empty element', () => {
    expect(getReadText(renderHtml('<p></p>'))).toBe('');
  });

  it.each([undefined, null, '', 'août 2021', 42, {}, document.createTextNode('août 2021')])(
    'reads nothing in %j, which is not an element',
    value => {
      expect(getReadText(value)).toBe('');
    },
  );
});
