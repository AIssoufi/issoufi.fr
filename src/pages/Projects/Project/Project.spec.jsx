import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../../i18n';
import { theme } from '../../../theme';
import { holdsFunctionSource } from '../../../cssRuleGuard';
import { stubMatchMedia } from '../../../mediaQueryTestUtils';
import { declaredStyle, listStyleRules, serializeCssValue } from '../../../styleTestUtils';
import { INTERACTIVE_SELECTOR } from '../../testUtils';

import {
  CARD_HOVER_LIFT_PX,
  CARD_MAX_TILT_DEG,
  CARD_PERSPECTIVE_PX,
  LIKED_PROJECTS_STORAGE_KEY,
  ROW_CARD_COUNT,
} from './constants';
import { useWholeCardCount } from './hooks/useWholeCardCount';
import Project from './Project';

// jsdom lays nothing out, so the row counts as many cards shown whole as it holds: the tests of a
// narrower screen give the count that it would measure
vi.mock('./hooks/useWholeCardCount', async importOriginal => {
  const hook = await importOriginal();
  return { ...hook, useWholeCardCount: vi.fn(hook.useWholeCardCount) };
});

/** Makes the row of every section count `count` cards shown whole, as on a narrower screen. */
const showWholeCards = count => {
  vi.mocked(useWholeCardCount).mockReturnValue({ listRef: () => {}, wholeCardCount: count });
};

const project = (id, name, extra = {}) => ({
  id,
  name,
  type: 'Application web',
  imageUrl: `/${id}.png`,
  tools: ['HTML 5', 'CSS 3'],
  ...extra,
});

const projects = [
  project(1, 'Chess', { url: 'https://example.com/chess' }),
  project(2, 'Calculator'),
  project(3, 'Plugin store'),
  project(4, 'Connect Four'),
];

/** Project that is not in the list of the first render. */
const ADDED_PROJECT = project(6, 'Weather app');
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

/** Stores the likes of a previous visit, as the like buttons do. */
const storeLikedIds = ids => localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, JSON.stringify(ids));

/** Makes every access to `localStorage` throw, as when the browser blocks it. */
const blockStorageAccess = () =>
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  });

/** French accessible names of the previous and next page buttons. */
const PREVIOUS_PAGE_NAME = 'Page précédente';
const NEXT_PAGE_NAME = 'Page suivante';

/** Previous and next page buttons, found by their French accessible names. */
const pageButtons = () => ({
  previousButton: screen.getByRole('button', { name: PREVIOUS_PAGE_NAME }),
  nextButton: screen.getByRole('button', { name: NEXT_PAGE_NAME }),
});

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
    vi.unstubAllGlobals();
    await act(() => i18n.changeLanguage('fr'));
    // Back to the hook itself, which mockReset gives back since Vitest 3. Only once the language
    // is back, since the change renders the sections of the test again, with the same hooks.
    vi.mocked(useWholeCardCount).mockReset();
    vi.restoreAllMocks();
    localStorage.clear();
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

    expect(cards()).toHaveLength(ROW_CARD_COUNT);

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
    ['a page of cards', { isShowingAll: false, controlCount: 3, cardCount: ROW_CARD_COUNT }],
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

    expect(likeButtonOf('Chess')).toHaveAttribute('aria-pressed', 'true');
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
    expect(likeButtonOf('Chess')).toHaveAttribute('aria-pressed', 'false');
  });

  it('gives no link to a project without a name, which would leave the link unnamed', () => {
    render(<Project projects={[{ ...NAMELESS_PROJECT, url: 'https://example.com/nameless' }]} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aimer' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('gives no link to a card whose url is empty', () => {
    render(<Project projects={[project(9, 'Draft', { url: '' })]} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(cardOf('Draft')).toHaveTextContent('Draft');
  });

  it('likes no project on a first visit, and shows no count', () => {
    render(<Project projects={projects} />);

    for (const { name } of projects.slice(0, ROW_CARD_COUNT)) {
      expect(likeButtonOf(name)).toHaveAttribute('aria-pressed', 'false');
      // The icon alone, hidden from screen readers: no count to show or to announce
      expect(likeButtonOf(name)).toHaveTextContent(/^$/);
      expect(likeButtonOf(name)).not.toHaveAttribute('aria-describedby');
    }
  });

  it('names each like button after its project, and tells its state', async () => {
    render(<Project projects={projects} />);

    await userEvent.click(likeButtonOf('Calculator'));
    expect(likeButtonOf('Calculator')).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(likeButtonOf('Calculator'));
    expect(likeButtonOf('Calculator')).toHaveAttribute('aria-pressed', 'false');
    expect(likeButtonOf('Calculator')).toHaveTextContent(/^$/);
  });

  it('likes only the project whose button is pressed', async () => {
    render(<Project projects={projects} />);

    await userEvent.click(likeButtonOf('Calculator'));

    expect(likeButtonOf('Calculator')).toHaveAttribute('aria-pressed', 'true');
    expect(likeButtonOf('Chess')).toHaveAttribute('aria-pressed', 'false');
    expect(likeButtonOf('Plugin store')).toHaveAttribute('aria-pressed', 'false');
  });

  it('names the like buttons in English once the language changes, keeping their state', async () => {
    render(<Project projects={projects} />);
    await userEvent.click(likeButtonOf('Chess'));

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('button', { name: 'Like Chess' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('button', { name: 'Aimer Chess' })).not.toBeInTheDocument();
  });

  it('hides the like icon from assistive technologies, in a plain button', () => {
    render(<Project projects={projects} />);
    const likeButton = likeButtonOf('Chess');

    expect(likeButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(likeButton).toHaveAttribute('type', 'button');
  });

  it('shows the likes stored on a previous visit', () => {
    storeLikedIds([1, 3]);

    render(<Project projects={projects} />);

    expect(likeButtonOf('Chess')).toHaveAttribute('aria-pressed', 'true');
    expect(likeButtonOf('Calculator')).toHaveAttribute('aria-pressed', 'false');
    expect(likeButtonOf('Plugin store')).toHaveAttribute('aria-pressed', 'true');
  });

  it.each([
    ['a reload', 'fr', 'Aimer Chess'],
    ['a change of language', 'en', 'Like Chess'],
  ])('keeps a like through %s, which renders the page again', async (_change, language, name) => {
    const { unmount } = render(<Project projects={projects} />);
    await userEvent.click(likeButtonOf('Chess'));
    unmount();

    await act(() => i18n.changeLanguage(language));
    render(<Project projects={projects} />);

    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the removal of a like through a reload', async () => {
    storeLikedIds([1]);
    const { unmount } = render(<Project projects={projects} />);
    await userEvent.click(likeButtonOf('Chess'));
    unmount();

    render(<Project projects={projects} />);

    expect(likeButtonOf('Chess')).toHaveAttribute('aria-pressed', 'false');
  });

  it('still toggles a like for the visit when the browser blocks the storage', async () => {
    blockStorageAccess();
    render(<Project projects={projects} />);

    await userEvent.click(likeButtonOf('Chess'));
    expect(likeButtonOf('Chess')).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(likeButtonOf('Chess'));
    expect(likeButtonOf('Chess')).toHaveAttribute('aria-pressed', 'false');
  });

  it('likes nothing when the stored likes are not a list of ids', () => {
    localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, '{"1":true}');

    render(<Project projects={projects} />);

    expect(likeButtonOf('Chess')).toHaveAttribute('aria-pressed', 'false');
  });

  it('still names the like button of a project without a name', () => {
    render(<Project projects={[NAMELESS_PROJECT]} />);

    expect(screen.getByRole('button', { name: 'Aimer' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('lets a card added after the first render be liked, starting from the stored likes', async () => {
    storeLikedIds([ADDED_PROJECT.id]);
    const { rerender } = render(<Project projects={projects} />);
    rerender(<Project projects={[ADDED_PROJECT, ...projects]} />);

    expect(likeButtonOf(ADDED_PROJECT.name)).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(likeButtonOf(ADDED_PROJECT.name));
    expect(likeButtonOf(ADDED_PROJECT.name)).toHaveAttribute('aria-pressed', 'false');
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

  it.each([
    [1, ['Chess', 'Calculator', 'Plugin store', 'Connect Four']],
    [2, ['Chess', 'Plugin store']],
    [3, ['Chess', 'Connect Four']],
  ])(
    'moves the row by the %i cards it shows whole, so the arrows show every project in turn',
    async (count, firstCardOfEachPage) => {
      showWholeCards(count);
      render(<Project projects={projects} />);
      const { previousButton, nextButton } = pageButtons();
      const firstCard = () => within(screen.getByRole('list')).getAllByRole('img')[0];

      expect(firstCard()).toHaveAccessibleName(firstCardOfEachPage[0]);
      for (const name of firstCardOfEachPage.slice(1)) {
        await userEvent.click(nextButton);
        expect(firstCard()).toHaveAccessibleName(name);
      }
      expect(nextButton).toHaveAttribute('aria-disabled', 'true');

      for (const name of firstCardOfEachPage.slice(0, -1).reverse()) {
        await userEvent.click(previousButton);
        expect(firstCard()).toHaveAccessibleName(name);
      }
      expect(previousButton).toHaveAttribute('aria-disabled', 'true');
    },
  );

  it('keeps three cards in the row, the next ones scrolled to, when it shows fewer whole', async () => {
    showWholeCards(1);
    render(<Project projects={projects} />);

    await userEvent.click(pageButtons().nextButton);

    const cards = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(cards).toHaveLength(ROW_CARD_COUNT);
    expect(cards[0]).toHaveTextContent('Calculator');
  });

  it('shows the last page once the screen widens past the page shown', async () => {
    showWholeCards(1);
    const { rerender } = render(<Project projects={projects} />);
    const { nextButton } = pageButtons();
    for (let page = 1; page < projects.length; page += 1) await userEvent.click(nextButton);
    expect(screen.getByRole('img')).toHaveAccessibleName('Connect Four');

    // Two cards shown whole: the last page starts on the third project
    showWholeCards(2);
    rerender(<Project projects={projects} />);

    const cards = within(screen.getByRole('list')).getAllByRole('img');
    expect(cards.map(card => card.getAttribute('alt'))).toEqual(['Plugin store', 'Connect Four']);
    expect(nextButton).toHaveAttribute('aria-disabled', 'true');
    expect(pageButtons().previousButton).toHaveAttribute('aria-disabled', 'false');
  });

  it('marks the arrow that would go past the first or the last page as disabled', async () => {
    render(<Project projects={projects} />);
    const { previousButton, nextButton } = pageButtons();

    expect(previousButton).toHaveAttribute('aria-disabled', 'true');
    expect(nextButton).toHaveAttribute('aria-disabled', 'false');

    await userEvent.click(nextButton);

    expect(previousButton).toHaveAttribute('aria-disabled', 'false');
    expect(nextButton).toHaveAttribute('aria-disabled', 'true');
    // The disabled attribute would take the focus away from the button
    for (const button of [previousButton, nextButton]) expect(button).toBeEnabled();
  });

  it.each([
    ['a single page of projects', projects.slice(0, ROW_CARD_COUNT)],
    ['a single project', projects.slice(0, 1)],
    ['no project', []],
  ])('marks both arrows as disabled with %s', (_cards, shownProjects) => {
    render(<Project projects={shownProjects} />);
    const { previousButton, nextButton } = pageButtons();

    expect(previousButton).toHaveAttribute('aria-disabled', 'true');
    expect(nextButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps the focus on an arrow pressed at a bound, which changes nothing', async () => {
    render(<Project projects={projects} />);
    const { previousButton, nextButton } = pageButtons();

    previousButton.focus();
    await userEvent.keyboard('{Enter}');
    expect(previousButton).toHaveFocus();
    expect(screen.getByText('Chess')).toBeInTheDocument();

    nextButton.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Enter}');
    expect(nextButton).toHaveFocus();
    expect(screen.getByRole('img')).toHaveAccessibleName('Connect Four');
  });

  it('puts the section buttons in the order of the screen, which Tab follows', async () => {
    render(<Project projects={projects} />);
    const { previousButton, nextButton } = pageButtons();
    const showAllButton = screen.getByRole('button', { name: 'Tout afficher (4)' });

    expect(within(screen.getByRole('group')).getAllByRole('button')).toEqual([
      previousButton,
      nextButton,
      showAllButton,
    ]);

    previousButton.focus();
    await userEvent.tab();
    expect(nextButton).toHaveFocus();
    await userEvent.tab();
    expect(showAllButton).toHaveFocus();
  });

  it('keeps the focus on "Show all" and "Show less" while they hide and show the arrows', async () => {
    render(<Project projects={projects} />);

    screen.getByRole('button', { name: 'Tout afficher (4)' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Afficher moins' })).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Tout afficher (4)' })).toHaveFocus();
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

  it('keeps the cards flat with reduced motion, their light still under the pointer', () => {
    stubMatchMedia({ matches: true });
    render(<Project projects={projects} />);
    const card = cardOf('Chess');
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(CARD_BOX);

    fireEvent.mouseMove(card, {
      clientX: CARD_BOX.left + CARD_POINTER.x,
      clientY: CARD_BOX.top + CARD_POINTER.y,
    });

    expect(card.style.transform).toBe('');
    expect(card.style.getPropertyValue('--mouse-x')).toBe(`${CARD_POINTER.x}px`);
    expect(card.style.getPropertyValue('--mouse-y')).toBe(`${CARD_POINTER.y}px`);
  });

  it('leaves the tech line of a project without tools empty', () => {
    render(<Project projects={[TOOLLESS_PROJECT]} />);

    const [, , techLine] = screen.getByText(TOOLLESS_PROJECT.name).parentElement.children;
    expect(techLine).toBeEmptyDOMElement();
  });

  describe('layout', () => {
    const TWO_COLUMNS_MEDIA = `(min-width: ${theme.screens['two-project-columns']})`;
    const TABLET_MEDIA = `(min-width: ${theme.screens.tablet})`;
    const THREE_COLUMNS_MEDIA = `(min-width: ${theme.screens['three-project-columns']})`;
    const WIDE_MEDIA = `(min-width: ${theme.screens.wide})`;
    /** Every breakpoint of the theme, after the rules outside any media query. */
    const ALL_MEDIA = ['', TWO_COLUMNS_MEDIA, TABLET_MEDIA, THREE_COLUMNS_MEDIA, WIDE_MEDIA];
    /** Properties that size a card: its width, its minimum width and the space around it. */
    const CARD_SIZE_PROPERTIES = ['flex', 'min-width', 'box-sizing', 'margin'];
    /** A card size property that no rule of a breakpoint declares. */
    const UNDECLARED = '';

    /**
     * Size of the card of a project as the generated CSS declares it, outside any media query and
     * at each breakpoint, since jsdom lays nothing out.
     */
    const cardSizeOf = name =>
      Object.fromEntries(
        ALL_MEDIA.map(media => [
          media,
          Object.fromEntries(
            CARD_SIZE_PROPERTIES.map(property => [
              property,
              declaredStyle({ element: cardOf(name), property, media }),
            ]),
          ),
        ]),
      );

    it('stretches the title link over its card, above the thumbnail and under the like button', () => {
      render(<Project projects={projects} />);

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
      expect(linkLayer('inset')).toBe('0px');
      expect([thumbnailGradientZIndex, likeButtonZIndex]).not.toContain('');
      expect(Number(linkLayer('z-index'))).toBeGreaterThan(Number(thumbnailGradientZIndex));
      expect(Number(linkLayer('z-index'))).toBeLessThan(Number(likeButtonZIndex));
    });

    it('draws the focus ring of the title link around the whole card, not around its text', () => {
      render(<Project projects={projects} />);

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
      render(<Project projects={projects} />);
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

    it('draws the like button as a circle around its heart, now that it shows no count', () => {
      render(<Project projects={projects} />);
      const style = property => declaredStyle({ element: likeButtonOf('Chess'), property });

      expect(style('width')).toBe(theme.sizes[32]);
      expect(style('height')).toBe(theme.sizes[32]);
      expect(style('padding')).toBe('0px');
      expect(style('border-radius')).toBe(theme.radii.circle);
      expect(style('justify-content')).toBe('center');
    });

    it('shows the cards of a page in a single row', () => {
      render(<Project projects={projects} />);

      const grid = gridOf('Chess');
      expect(declaredStyle({ element: grid, property: 'display' })).toBe('flex');
      expect(declaredStyle({ element: grid, property: 'grid-template-columns' })).toBe('');
      // A last page with fewer cards starts on the left, in the columns of the first page
      expect(declaredStyle({ element: grid, property: 'justify-content' })).toBe('flex-start');
    });

    it('wraps the row of cards onto as many rows as needed after "Show all"', async () => {
      render(<Project projects={projects} />);

      await userEvent.click(screen.getByText('Tout afficher (4)'));

      const grid = gridOf('Connect Four');
      expect(declaredStyle({ element: grid, property: 'display' })).toBe('flex');
      expect(declaredStyle({ element: grid, property: 'flex-wrap' })).toBe('wrap');
      // A last row with fewer cards starts on the left, under the first columns
      expect(declaredStyle({ element: grid, property: 'justify-content' })).toBe('flex-start');
      expect(declaredStyle({ element: grid, property: 'row-gap' })).toBe(theme.space[5]);
      for (const media of ALL_MEDIA) {
        expect(declaredStyle({ element: grid, property: 'grid-template-columns', media })).toBe('');
      }
    });

    it('keeps the size of the cards of the row after "Show all", at every breakpoint', async () => {
      render(<Project projects={projects} />);
      const rowCardSize = cardSizeOf('Chess');

      await userEvent.click(screen.getByText('Tout afficher (4)'));

      // A size that jsdom failed to parse would be empty in both modes, and pass unnoticed. Each
      // width is a share of the row less the margins, which jsdom may serialize already computed,
      // with no minimum width, which would leave the columns short of the width of the section.
      expect(rowCardSize).toEqual({
        // One column on a phone, as wide as the space between the page gutters
        '': {
          flex: expect.stringMatching(/^0 0 calc\(100% - /),
          'min-width': UNDECLARED,
          'box-sizing': UNDECLARED,
          margin: theme.space['project-card-margin'],
        },
        [TWO_COLUMNS_MEDIA]: {
          flex: expect.stringMatching(/^0 0 calc\(50% - /),
          'min-width': UNDECLARED,
          'box-sizing': UNDECLARED,
          margin: UNDECLARED,
        },
        [TABLET_MEDIA]: {
          flex: UNDECLARED,
          'min-width': UNDECLARED,
          'box-sizing': UNDECLARED,
          margin: UNDECLARED,
        },
        [THREE_COLUMNS_MEDIA]: {
          flex: expect.stringMatching(/^0 0 calc\(33\.333% - /),
          'min-width': UNDECLARED,
          'box-sizing': UNDECLARED,
          margin: UNDECLARED,
        },
        [WIDE_MEDIA]: {
          flex: UNDECLARED,
          'min-width': UNDECLARED,
          'box-sizing': UNDECLARED,
          margin: UNDECLARED,
        },
      });
      expect(cardSizeOf('Chess')).toEqual(rowCardSize);
    });

    it('dims an arrow marked as disabled, and keeps the hover color for the others', () => {
      render(<Project projects={projects} />);
      const { previousButton } = pageButtons();
      const disabledState = "[aria-disabled='true']";
      const arrowStyle = ({ property, pseudo }) =>
        declaredStyle({ element: previousButton, property, pseudo });

      expect(arrowStyle({ property: 'opacity', pseudo: disabledState })).toBe('0.4');
      expect(arrowStyle({ property: 'cursor', pseudo: disabledState })).toBe('default');
      expect(
        arrowStyle({ property: 'background-color', pseudo: `:hover:not(${disabledState})` }),
      ).toBe(serializeCssValue({ property: 'background-color', value: theme.colors.accent }));
      // A hover color for every state would light up the disabled arrow too
      expect(arrowStyle({ property: 'background-color', pseudo: ':hover' })).toBe(UNDECLARED);
    });

    it('lays the section buttons out in the order of the page, which Tab follows', () => {
      render(<Project projects={projects} />);
      const controls = screen.getByRole('group');

      expect(declaredStyle({ element: controls, property: 'flex-direction' })).toBe('row');
      for (const media of ALL_MEDIA) {
        for (const button of within(controls).getAllByRole('button')) {
          expect(declaredStyle({ element: button, property: 'order', media })).toBe(UNDECLARED);
        }
      }
    });

    it('generates no function source text in the CSS of the "Show all" rows', async () => {
      render(<Project projects={projects} />);

      await userEvent.click(screen.getByText('Tout afficher (4)'));

      const rules = listStyleRules();
      const css = rules.map(({ rule }) => rule.cssText).join('');
      expect(css).toContain(`row-gap: ${theme.space[5]}`);
      expect(rules.map(({ media }) => media)).toContain(`(min-width: ${theme.screens.tablet})`);
      expect(holdsFunctionSource(css)).toBe(false);
    });

    it.each([
      ['the row of a page', false],
      ['the "Show all" rows', true],
    ])('lets a long tech line wrap inside its card in %s', async (_layout, isShowingAll) => {
      render(<Project projects={[LONG_TECH_LINE_PROJECT, ...projects]} />);

      if (isShowingAll) await userEvent.click(screen.getByText('Tout afficher (5)'));

      // jsdom drops a stylesheet it cannot parse, which would leave no white-space to find
      const grid = gridOf(LONG_TECH_LINE_PROJECT.name);
      expect(declaredStyle({ element: grid, property: 'display' })).not.toBe('');

      const techLine = screen.getByText(LONG_TECH_LINE_PROJECT.tools.join(' · '));
      expect(inheritedWhiteSpace(techLine)).toBe('normal');
    });
  });
});
