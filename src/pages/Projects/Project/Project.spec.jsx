import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@xstyled/styled-components';

import i18n from '../../../i18n';
import { theme } from '../../../theme';

import { CARD_HOVER_LIFT_PX, CARD_MAX_TILT_DEG, CARD_PERSPECTIVE_PX } from './constants';
import Project from './Project';

const project = (id, name, extra = {}) => ({
  id,
  name,
  type: 'Application web',
  imageUrl: `/${id}.png`,
  tools: ['HTML 5', 'CSS 3'],
  likeCount: 0,
  isLikedByOwnUser: false,
  ...extra,
});

const projects = [
  project(1, 'Chess', { url: 'https://example.com/chess', likeCount: 2, isLikedByOwnUser: true }),
  project(2, 'Calculator'),
  project(3, 'Plugin store'),
  project(4, 'Connect Four'),
];

/** Project that is not in the list of the first render. */
const ADDED_PROJECT = project(6, 'Weather app', { likeCount: 5, isLikedByOwnUser: true });
const TOOLLESS_PROJECT = project(7, 'Landing page', { tools: undefined });
const NAMELESS_PROJECT = project(8, undefined);

/** Box of a card in the viewport. */
const CARD_BOX = { left: 100, top: 100, width: 200, height: 100 };
/**
 * Pointer on the right edge of {@link CARD_BOX}, a quarter of the way down: the full tilt around
 * the vertical axis and half of it around the horizontal one, so the two cannot be mixed up.
 */
const CARD_POINTER = { x: CARD_BOX.width, y: CARD_BOX.height / 4 };

/** Like button of a card, found by its French accessible name, which holds the project name. */
const likeButtonOf = name => screen.getByRole('button', { name: `Aimer ${name}` });

/** French accessible names of the previous and next page buttons. */
const PREVIOUS_PAGE_NAME = 'Page précédente';
const NEXT_PAGE_NAME = 'Page suivante';

/** Previous and next page buttons, found by their French accessible names. */
const pageButtons = () => ({
  previousButton: screen.getByRole('button', { name: PREVIOUS_PAGE_NAME }),
  nextButton: screen.getByRole('button', { name: NEXT_PAGE_NAME }),
});

/** Renders with the theme, so that the styles hold the token values instead of their names. */
const renderWithTheme = ui => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

/** Element that lays out the cards: the closest `main` of a card's thumbnail. */
const gridOf = name => screen.getByRole('img', { name }).closest('main');

/** Every style rule of the document, with the condition of the media query holding it, if any. */
const listStyleRules = () =>
  [...document.styleSheets].flatMap(sheet =>
    [...sheet.cssRules].flatMap(rule =>
      rule instanceof CSSMediaRule
        ? [...rule.cssRules].map(innerRule => ({ media: rule.media.mediaText, rule: innerRule }))
        : [{ media: '', rule }],
    ),
  );

/**
 * Value that the generated CSS declares for a property on one of the element's classes, outside
 * any media query or inside the given one; the last declaration wins, and `''` means none.
 */
const declaredStyle = ({ element, property, media = '' }) => {
  const classSelectors = [...element.classList].map(className => `.${className}`);
  const isRuleOfElement = entry => {
    const isInMedia = entry.media === media;
    return isInMedia && classSelectors.includes(entry.rule.selectorText);
  };
  const values = listStyleRules()
    .filter(isRuleOfElement)
    .map(({ rule }) => rule.style.getPropertyValue(property));
  return values.findLast(Boolean) ?? '';
};

/**
 * `white-space` that the element inherits from the closest element declaring one, since jsdom
 * does not compute inherited values; `normal` when none declares it. Only reads the rules outside
 * media queries.
 */
const inheritedWhiteSpace = element => {
  for (let node = element; node; node = node.parentElement) {
    const whiteSpace = declaredStyle({ element: node, property: 'white-space' });
    if (whiteSpace) return whiteSpace;
  }
  return 'normal';
};

const LONG_TECH_LINE_PROJECT = project(5, 'Chess engine', {
  tools: ['HTML 5', 'CSS 3', 'JavaScript', 'Gulp', 'Mocha', 'Babel', 'Webpack', 'TypeScript'],
});

describe('Project', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders without any props', () => {
    expect(() => render(<Project />)).not.toThrow();
    expect(screen.getByText('Tout afficher (0)')).toBeInTheDocument();
    expect(pageButtons().previousButton).toBeInTheDocument();
    expect(pageButtons().nextButton).toBeInTheDocument();
  });

  it('names the page buttons in English once the language changes', async () => {
    render(<Project projects={projects} />);

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: PREVIOUS_PAGE_NAME })).not.toBeInTheDocument();
  });

  it('hides the page button icons from assistive technologies', () => {
    render(<Project projects={projects} />);
    const { previousButton, nextButton } = pageButtons();

    for (const button of [previousButton, nextButton]) {
      expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('makes the page buttons plain buttons, which submit no form', () => {
    render(<Project projects={projects} />);
    const { previousButton, nextButton } = pageButtons();

    expect(previousButton).toHaveAttribute('type', 'button');
    expect(nextButton).toHaveAttribute('type', 'button');
  });

  it('shows the first three projects, then all of them on demand', async () => {
    render(
      <Project
        title="Projets personnels"
        projects={projects}
      />,
    );

    expect(screen.getByText('Projets personnels')).toBeInTheDocument();
    expect(screen.getByText('Chess')).toBeInTheDocument();
    expect(screen.queryByText('Connect Four')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Tout afficher (4)'));

    expect(screen.getByText('Connect Four')).toBeInTheDocument();
    expect(screen.getByText('Afficher moins')).toBeInTheDocument();
  });

  it('links a project to its url when it has one', () => {
    render(<Project projects={projects} />);

    expect(screen.getByText('Chess').closest('a')).toHaveAttribute(
      'href',
      'https://example.com/chess',
    );
    expect(screen.getByText('Calculator').closest('a')).toBeNull();
  });

  it('does not follow the card link when the like button is clicked', () => {
    render(<Project projects={projects} />);

    const isDefaultAllowed = fireEvent.click(likeButtonOf('Chess'));

    expect(isDefaultAllowed).toBe(false);
    expect(likeButtonOf('Chess')).toHaveTextContent('1');
  });

  it('names each like button after its project, and tells its state and count', async () => {
    render(<Project projects={projects} />);

    expect(likeButtonOf('Chess')).toHaveAttribute('aria-pressed', 'true');
    expect(likeButtonOf('Chess')).toHaveAccessibleDescription('2');
    expect(likeButtonOf('Calculator')).toHaveAttribute('aria-pressed', 'false');
    expect(likeButtonOf('Calculator')).toHaveAccessibleDescription('0');

    await userEvent.click(likeButtonOf('Calculator'));

    expect(likeButtonOf('Calculator')).toHaveAttribute('aria-pressed', 'true');
    expect(likeButtonOf('Calculator')).toHaveAccessibleDescription('1');
  });

  it('names the like buttons in English once the language changes', async () => {
    render(<Project projects={projects} />);

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('button', { name: 'Like Chess' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aimer Chess' })).not.toBeInTheDocument();
  });

  it('hides the like icon from assistive technologies, in a plain button', () => {
    render(<Project projects={projects} />);
    const likeButton = likeButtonOf('Chess');

    expect(likeButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(likeButton).toHaveAttribute('type', 'button');
  });

  it('describes each like button by the count of its own card, in every section', () => {
    render(
      <>
        <Project projects={projects} />
        <Project projects={[project(1, 'Chess', { likeCount: 9 })]} />
      </>,
    );

    const [firstChessLike, secondChessLike] = screen.getAllByRole('button', {
      name: 'Aimer Chess',
    });
    expect(firstChessLike).toHaveAccessibleDescription('2');
    expect(secondChessLike).toHaveAccessibleDescription('9');
  });

  it('still names the like button of a project without a name', () => {
    render(<Project projects={[NAMELESS_PROJECT]} />);

    expect(screen.getByRole('button', { name: 'Aimer' })).toHaveAccessibleDescription('0');
  });

  it('toggles the like count', async () => {
    render(<Project projects={projects} />);

    await userEvent.click(likeButtonOf('Calculator'));
    expect(likeButtonOf('Calculator')).toHaveTextContent('1');

    await userEvent.click(likeButtonOf('Chess'));
    expect(likeButtonOf('Chess')).toHaveTextContent('1');
  });

  it('starts a card missing from the likes of the first render at no like', async () => {
    const { rerender } = render(<Project projects={projects} />);
    rerender(<Project projects={[ADDED_PROJECT, ...projects]} />);

    expect(likeButtonOf(ADDED_PROJECT.name)).toHaveTextContent('0');

    await userEvent.click(likeButtonOf(ADDED_PROJECT.name));
    expect(likeButtonOf(ADDED_PROJECT.name)).toHaveTextContent('1');
  });

  it('pages through the projects, without going past the first or the last page', async () => {
    render(<Project projects={projects} />);
    const { previousButton, nextButton } = pageButtons();

    await userEvent.click(previousButton);
    expect(screen.getByText('Chess')).toBeInTheDocument();

    await userEvent.click(nextButton);
    expect(screen.getByText('Connect Four')).toBeInTheDocument();
    expect(screen.queryByText('Chess')).not.toBeInTheDocument();

    await userEvent.click(nextButton);
    expect(screen.getByText('Connect Four')).toBeInTheDocument();

    await userEvent.click(previousButton);
    expect(screen.getByText('Chess')).toBeInTheDocument();
    expect(screen.queryByText('Connect Four')).not.toBeInTheDocument();
  });

  it('hides the page buttons while every project is shown', async () => {
    render(<Project projects={projects} />);

    await userEvent.click(screen.getByText('Tout afficher (4)'));

    expect(screen.queryByRole('button', { name: PREVIOUS_PAGE_NAME })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: NEXT_PAGE_NAME })).not.toBeInTheDocument();
    expect(within(screen.getByRole('navigation')).getAllByRole('button')).toHaveLength(1);
  });

  it('tilts a card toward the pointer, then flattens it when the pointer leaves', () => {
    render(<Project projects={projects} />);
    const card = screen.getByText('Chess').closest('a');
    // jsdom lays nothing out: give the card a box so that it can tilt
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(CARD_BOX);

    fireEvent.mouseMove(card, {
      clientX: CARD_BOX.left + CARD_POINTER.x,
      clientY: CARD_BOX.top + CARD_POINTER.y,
    });
    expect(card.style.transform).toBe(
      `perspective(${CARD_PERSPECTIVE_PX}px) rotateX(${CARD_MAX_TILT_DEG / 2}deg) rotateY(${CARD_MAX_TILT_DEG}deg) translateY(-${CARD_HOVER_LIFT_PX}px)`,
    );
    expect(card.style.getPropertyValue('--mouse-x')).toBe(`${CARD_POINTER.x}px`);
    expect(card.style.getPropertyValue('--mouse-y')).toBe(`${CARD_POINTER.y}px`);

    fireEvent.mouseLeave(card);
    expect(card.style.transform).toBe('');
  });

  it('leaves the tech line of a project without tools empty', () => {
    render(<Project projects={[TOOLLESS_PROJECT]} />);

    const [, , techLine] = screen.getByText(TOOLLESS_PROJECT.name).parentElement.children;
    expect(techLine).toBeEmptyDOMElement();
  });

  describe('layout', () => {
    const ONE_COLUMN = 'repeat(1, minmax(min-content, 1fr))';
    const TWO_COLUMNS = 'repeat(2, minmax(min-content, 1fr))';
    const THREE_COLUMNS = 'repeat(3, minmax(min-content, 1fr))';
    const TABLET_MEDIA = `(min-width: ${theme.screens.tablet})`;
    const WIDE_MEDIA = `(min-width: ${theme.screens.wide})`;

    it('shows the cards of a page in a single row', () => {
      renderWithTheme(<Project projects={projects} />);

      const grid = gridOf('Chess');
      expect(declaredStyle({ element: grid, property: 'display' })).toBe('flex');
      expect(declaredStyle({ element: grid, property: 'grid-template-columns' })).toBe('');
    });

    it('shows every card in a grid of one, then two, then three columns after "Show all"', async () => {
      renderWithTheme(<Project projects={projects} />);

      await userEvent.click(screen.getByText('Tout afficher (4)'));

      const grid = gridOf('Connect Four');
      expect(declaredStyle({ element: grid, property: 'display' })).toBe('grid');
      expect(declaredStyle({ element: grid, property: 'row-gap' })).toBe(theme.space[5]);
      expect(declaredStyle({ element: grid, property: 'grid-template-columns' })).toBe(ONE_COLUMN);
      expect(
        declaredStyle({ element: grid, property: 'grid-template-columns', media: TABLET_MEDIA }),
      ).toBe(TWO_COLUMNS);
      expect(
        declaredStyle({ element: grid, property: 'grid-template-columns', media: WIDE_MEDIA }),
      ).toBe(THREE_COLUMNS);
    });

    it('generates no function source text in the CSS of the "Show all" grid', async () => {
      renderWithTheme(<Project projects={projects} />);

      await userEvent.click(screen.getByText('Tout afficher (4)'));

      const css = [...document.querySelectorAll('style')].map(style => style.textContent).join('');
      expect(css).toContain(`row-gap:${theme.space[5]}`);
      expect(css).toMatch(new RegExp(`@media \\(min-width: ?${theme.screens.tablet}\\)`));
      expect(css).not.toMatch(/=>|\bfunction\b|\bprops\b/);
    });

    it.each([
      ['the row of a page', false],
      ['the "Show all" grid', true],
    ])('lets a long tech line wrap inside its card in %s', async (_layout, isShowingAll) => {
      renderWithTheme(<Project projects={[LONG_TECH_LINE_PROJECT, ...projects]} />);

      if (isShowingAll) await userEvent.click(screen.getByText('Tout afficher (5)'));

      // jsdom drops a stylesheet it cannot parse, which would leave no white-space to find
      const grid = gridOf(LONG_TECH_LINE_PROJECT.name);
      expect(declaredStyle({ element: grid, property: 'display' })).not.toBe('');

      const techLine = screen.getByText(LONG_TECH_LINE_PROJECT.tools.join(' · '));
      expect(inheritedWhiteSpace(techLine)).toBe('normal');
    });
  });
});
