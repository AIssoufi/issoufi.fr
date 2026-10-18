import { focusPageHeading } from './utils';

/** Fills the document with some HTML and returns its body. */
const renderHtml = (html: string) => {
  document.body.innerHTML = html;
  return document.body;
};

describe('focusPageHeading', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('focuses the first h1 of the document, out of the Tab order', () => {
    renderHtml('<a href="/">Link</a><h1>Projects</h1><h1>Freelance</h1>');

    focusPageHeading();

    const [heading] = document.querySelectorAll('h1');
    expect(heading).toHaveFocus();
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('keeps the tabindex a heading already has', () => {
    renderHtml('<h1 tabindex="0">Projects</h1>');

    focusPageHeading();

    expect(document.querySelector('h1')).toHaveFocus();
    expect(document.querySelector('h1')).toHaveAttribute('tabindex', '0');
  });

  it('looks for the heading inside the given root only', () => {
    renderHtml('<h1>Outside</h1><section><h1>Inside</h1></section>');

    focusPageHeading({ root: document.querySelector('section') });

    expect(document.querySelector('section h1')).toHaveFocus();
  });

  it('ignores the headings of a lower level', () => {
    renderHtml('<button>Button</button><h2>Section</h2>');
    document.querySelector('button')?.focus();

    focusPageHeading();

    expect(document.querySelector('button')).toHaveFocus();
    expect(document.querySelector('h2')).not.toHaveAttribute('tabindex');
  });

  it.each([
    ['a root without heading', () => renderHtml('<p>Text</p>')],
    ['an empty root', () => renderHtml('')],
    ['a missing root', () => null],
  ])('leaves the focus where it is for %s', (_case, getRoot) => {
    const root = getRoot();
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();

    expect(() => focusPageHeading({ root })).not.toThrow();

    expect(button).toHaveFocus();
  });

  it('leaves the focus where it is without any parameter on a page without heading', () => {
    renderHtml('<button>Button</button>');
    document.querySelector('button')?.focus();

    focusPageHeading();

    expect(document.querySelector('button')).toHaveFocus();
  });
});
