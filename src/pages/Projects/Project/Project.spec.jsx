import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@xstyled/styled-components';

import i18n from '../../../i18n';
import { theme } from '../../../theme';
import { INTERACTIVE_SELECTOR, declaredStyle, listStyleRules } from '../../testUtils';

import { CARD_HOVER_LIFT_PX, CARD_MAX_TILT_DEG, CARD_PERSPECTIVE_PX, PAGE_SIZE } from './constants';
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

/** Element that lays out the cards: the list holding a card's thumbnail. */
const gridOf = name => screen.getByRole('img', { name }).closest('ul');

/** Card of a project: the item of the grid that holds its thumbnail. */
const cardOf = name => screen.getByRole('img', { name }).closest('li');

/** Link of a card title, found by the project name. */
const linkOf = name => screen.getByRole('link', { name });

/**
 * Ways to press a like button: with the mouse, then with each key that presses a focused button.
 */
const LIKE_PRESSES = [
  ['a click', button => userEvent.click(button)],
  [
    'Enter',
    async button => {
      button.focus();
      await userEvent.keyboard('{Enter}');
    },
  ],
  [
    'Space',
    async button => {
      button.focus();
      await userEvent.keyboard(' ');
    },
  ],
];

/**
 * Listens to the clicks on the link of a card title, without letting jsdom follow it, which it
 * cannot do.
 */
const spyOnLinkClicks = name => {
  const onLinkClick = vi.fn(event => event.preventDefault());
  linkOf(name).addEventListener('click', onLinkClick);
  return onLinkClick;
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
    expect(screen.getByRole('group')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeEmptyDOMElement();
    expect(screen.getByRole('list')).toHaveAttribute('role', 'list');
  });

  it('titles the section with a level 2 heading, leaving the level 1 to the page', () => {
    render(
      <Project
        title="Projets personnels"
        projects={projects}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Projets personnels' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it.each([undefined, null, '', '   ', 42])(
    'renders no empty heading and leaves the controls unnamed when the title is %j',
    title => {
      render(
        <Project
          title={title}
          projects={projects}
        />,
      );

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      expect(screen.getByRole('group')).not.toHaveAttribute('aria-labelledby');
    },
  );

  it('lists the cards, without a main landmark, which only the page renders', async () => {
    render(<Project projects={projects} />);
    const cards = () => within(screen.getByRole('list')).getAllByRole('listitem');

    expect(cards()).toHaveLength(PAGE_SIZE);

    await userEvent.click(screen.getByText('Tout afficher (4)'));

    expect(cards()).toHaveLength(projects.length);
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
  });

  it('gives the cards an explicit list role, which Safari drops from lists without bullets', async () => {
    render(<Project projects={projects} />);

    expect(screen.getByRole('list')).toHaveAttribute('role', 'list');

    await userEvent.click(screen.getByText('Tout afficher (4)'));

    expect(screen.getByRole('list')).toHaveAttribute('role', 'list');
  });

  it('groups the section controls under the section title, without a navigation landmark', () => {
    render(
      <Project
        title="Projets personnels"
        projects={projects}
      />,
    );

    const controls = screen.getByRole('group', { name: 'Projets personnels' });
    expect(within(controls).getByText('Tout afficher (4)')).toBeInTheDocument();
    expect(within(controls).getByRole('button', { name: PREVIOUS_PAGE_NAME })).toBeInTheDocument();
    expect(within(controls).getByRole('button', { name: NEXT_PAGE_NAME })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('labels the controls of each section after its own title', () => {
    render(
      <>
        <Project
          title="Projets personnels"
          projects={projects}
        />
        <Project
          title="Projets freelance"
          projects={projects}
        />
      </>,
    );

    expect(screen.getByRole('group', { name: 'Projets personnels' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Projets freelance' })).toBeInTheDocument();
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

  // "Show all" and the two page buttons, then "Show less" alone, plus one like button per card
  it.each([
    ['a page of cards', { isShowingAll: false, controlCount: 3, cardCount: PAGE_SIZE }],
    ['every card', { isShowingAll: true, controlCount: 1, cardCount: projects.length }],
  ])(
    'makes every button a plain button, which submits no form, while showing %s',
    async (_shownCards, { isShowingAll, controlCount, cardCount }) => {
      render(<Project projects={projects} />);

      if (isShowingAll) await userEvent.click(screen.getByText('Tout afficher (4)'));

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(controlCount + cardCount);
      for (const button of buttons) expect(button).toHaveAttribute('type', 'button');
    },
  );

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

  it('links the title of a project to its url, in a new tab, when it has one', () => {
    render(<Project projects={projects} />);

    expect(linkOf('Chess')).toHaveAttribute('href', 'https://example.com/chess');
    expect(linkOf('Chess')).toHaveAttribute('target', '_blank');
    expect(linkOf('Chess')).toHaveAttribute('rel', 'noreferrer');
    expect(screen.getAllByRole('link')).toEqual([linkOf('Chess')]);
    expect(cardOf('Calculator')).toHaveTextContent('Calculator');
  });

  it('keeps the card itself, its thumbnail and its like button out of the link', () => {
    render(<Project projects={projects} />);

    expect(cardOf('Chess').tagName).toBe('LI');
    expect(cardOf('Chess').closest('a')).toBeNull();
    expect(screen.getByRole('img', { name: 'Chess' }).closest('a')).toBeNull();
    expect(likeButtonOf('Chess').closest('a')).toBeNull();
    expect(linkOf('Chess')).toHaveTextContent(/^Chess$/);
    expect(linkOf('Chess').querySelector(INTERACTIVE_SELECTOR)).toBeNull();
  });

  it.each(LIKE_PRESSES)('likes a card without opening its link on %s', async (_press, press) => {
    render(<Project projects={projects} />);
    const onLinkClick = spyOnLinkClicks('Chess');

    await press(likeButtonOf('Chess'));

    expect(likeButtonOf('Chess')).toHaveAttribute('aria-pressed', 'false');
    expect(likeButtonOf('Chess')).toHaveTextContent('1');
    expect(onLinkClick).not.toHaveBeenCalled();
  });

  it('opens the project from the keyboard, with the title link reached after the like button', async () => {
    render(<Project projects={projects} />);
    const onLinkClick = spyOnLinkClicks('Chess');

    likeButtonOf('Chess').focus();
    await userEvent.tab();
    expect(linkOf('Chess')).toHaveFocus();

    await userEvent.keyboard('{Enter}');

    expect(onLinkClick).toHaveBeenCalledOnce();
    expect(likeButtonOf('Chess')).toHaveTextContent('2');
  });

  it('gives no link to a project without a name, which would leave the link unnamed', () => {
    render(<Project projects={[{ ...NAMELESS_PROJECT, url: 'https://example.com/nameless' }]} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aimer' })).toHaveAccessibleDescription('0');
  });

  it('gives no link to a card whose url is empty', () => {
    render(<Project projects={[project(9, 'Draft', { url: '' })]} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(cardOf('Draft')).toHaveTextContent('Draft');
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
    expect(within(screen.getByRole('group')).getAllByRole('button')).toHaveLength(1);
  });

  it('tilts a card toward the pointer, then flattens it when the pointer leaves', () => {
    render(<Project projects={projects} />);
    const card = cardOf('Chess');
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

    it('stretches the title link over its card, above the thumbnail and under the like button', () => {
      renderWithTheme(<Project projects={projects} />);

      const linkLayer = property =>
        declaredStyle({ element: linkOf('Chess'), property, pseudo: '::after' });
      const thumbnailOverlay = screen.getByRole('img', { name: 'Chess' }).parentElement;
      const thumbnailGradientZIndex = declaredStyle({
        element: thumbnailOverlay,
        property: 'z-index',
        pseudo: '::before',
      });
      const likeButtonZIndex = declaredStyle({
        element: likeButtonOf('Chess'),
        property: 'z-index',
      });

      expect(declaredStyle({ element: cardOf('Chess'), property: 'position' })).toBe('relative');
      expect(linkLayer('position')).toBe('absolute');
      expect(linkLayer('inset')).toBe('0');
      expect([thumbnailGradientZIndex, likeButtonZIndex]).not.toContain('');
      expect(Number(linkLayer('z-index'))).toBeGreaterThan(Number(thumbnailGradientZIndex));
      expect(Number(linkLayer('z-index'))).toBeLessThan(Number(likeButtonZIndex));
    });

    it('draws the focus ring of the title link around the whole card, not around its text', () => {
      renderWithTheme(<Project projects={projects} />);

      const focusedLinkStyle = ({ property, pseudo }) =>
        declaredStyle({ element: linkOf('Chess'), property, pseudo });

      expect(focusedLinkStyle({ property: 'outline', pseudo: ':focus-visible' })).toBe('none');
      expect(focusedLinkStyle({ property: 'outline', pseudo: ':focus-visible::after' })).toBe(
        'auto',
      );
      expect(focusedLinkStyle({ property: 'border-radius', pseudo: '::after' })).toBe(
        theme.radii.md,
      );
    });

    it('shrinks the like button while it is pressed, even under the pointer', () => {
      renderWithTheme(<Project projects={projects} />);
      const likeButton = likeButtonOf('Chess');
      // Position in the cascade of the last rule that sets the button's transform in a state
      const lastTransformRuleIndex = state => {
        const stateSelectors = [...likeButton.classList].map(className => `.${className}${state}`);
        return listStyleRules().findLastIndex(({ media, rule }) => {
          const isRuleOfState = media === '' && stateSelectors.includes(rule.selectorText);
          // Also skips the @keyframes rules, which have no style
          if (!isRuleOfState) return false;
          return rule.style.getPropertyValue('transform') !== '';
        });
      };

      expect(declaredStyle({ element: likeButton, property: 'transform', pseudo: ':hover' })).toBe(
        'scale(1.06)',
      );
      expect(declaredStyle({ element: likeButton, property: 'transform', pseudo: ':active' })).toBe(
        'scale(0.93)',
      );
      // A pressed button is hovered too: the rule of :active must come last to win
      expect(lastTransformRuleIndex(':hover')).toBeGreaterThan(-1);
      expect(lastTransformRuleIndex(':active')).toBeGreaterThan(lastTransformRuleIndex(':hover'));
    });

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
