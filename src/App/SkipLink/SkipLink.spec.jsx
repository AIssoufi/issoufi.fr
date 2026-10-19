import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../i18n';
import { declaredStyle } from '../../styleTestUtils';
import { theme } from '../../theme';
import SkipLink from './SkipLink';

const getLink = () => screen.getByRole('link', { name: 'Aller au contenu' });

/** Renders the skip link first, before a link of the header, then a page with its heading. */
const renderWithPage = () =>
  render(
    <>
      <SkipLink />
      <a href="/">AI</a>
      <main id="content">
        <h1>Projets</h1>
        <a href="/projects">Voir le projet</a>
      </main>
    </>,
  );

describe('SkipLink', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
    window.history.replaceState(null, '', '/');
  });

  it('renders a link to the main landmark of the page without any props', () => {
    render(<SkipLink />);

    expect(getLink()).toHaveTextContent(/^Aller au contenu$/);
    expect(getLink()).toHaveAttribute('href', '#content');
  });

  it('says so in English once English is active', async () => {
    render(<SkipLink />);

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
  });

  it('is the first element that Tab reaches', async () => {
    const user = userEvent.setup();
    renderWithPage();

    await user.tab();

    expect(getLink()).toHaveFocus();
  });

  it.each([
    ['Enter', () => userEvent.setup().keyboard('{Enter}')],
    ['a click', () => userEvent.setup().click(getLink())],
  ])('moves the focus to the heading of the page on %s', async (_, follow) => {
    renderWithPage();
    getLink().focus();

    await follow();

    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('lets the next Tab reach the content, after the heading', async () => {
    const user = userEvent.setup();
    renderWithPage();
    getLink().focus();

    await user.keyboard('{Enter}');
    await user.tab();

    expect(screen.getByRole('link', { name: 'Voir le projet' })).toHaveFocus();
  });

  it('adds no fragment to the URL', async () => {
    const user = userEvent.setup();
    renderWithPage();
    getLink().focus();

    await user.keyboard('{Enter}');

    expect(window.location.hash).toBe('');
  });

  it('leaves the focus on itself on a page without heading', async () => {
    const user = userEvent.setup();
    render(<SkipLink />);
    getLink().focus();

    await user.keyboard('{Enter}');

    expect(getLink()).toHaveFocus();
    expect(window.location.hash).toBe('');
  });

  it('is hidden until it has the focus', () => {
    render(<SkipLink />);

    expect(declaredStyle({ element: getLink(), property: 'clip-path' })).toBe('inset(50%)');
    expect(declaredStyle({ element: getLink(), property: 'clip-path', pseudo: ':focus' })).toBe(
      'none',
    );
  });

  it('stands out of the flow, above the header', () => {
    render(<SkipLink />);

    expect(declaredStyle({ element: getLink(), property: 'position' })).toBe('fixed');
    expect(Number(declaredStyle({ element: getLink(), property: 'z-index' }))).toBeGreaterThan(
      theme.zIndices.header,
    );
  });
});
