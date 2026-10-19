import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../../i18n';
import { theme } from '../../../theme';
import { HOVER_POINTER_QUERY } from '../../../theme/constants';
import { holdsFunctionSource } from '../../../cssRuleGuard';
import { stubMatchMedia } from '../../../mediaQueryTestUtils';
import {
  blendColors,
  declaredStyle,
  FORCED_COLORS_MEDIA,
  getContrastRatio,
  listStyleRules,
  MIN_ICON_CONTRAST_RATIO,
  serializeCssValue,
} from '../../../styleTestUtils';
import { INTERACTIVE_SELECTOR } from '../../testUtils';

import {
  CARD_HOVER_LIFT_PX,
  CARD_MAX_TILT_DEG,
  CARD_PERSPECTIVE_PX,
  LIKE_ANIMATION_MS,
  LIKED_PROJECTS_STORAGE_KEY,
  ROW_CARD_COUNT,
  THUMBNAIL_SIZES,
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

/** Files of the screenshot of the project `id`, at two widths, the narrowest first. */
const thumbnailsOf = id => [
  { url: `/${id}-480.webp`, width: 480, height: 300 },
  { url: `/${id}-960.webp`, width: 960, height: 600 },
];

/** `srcset` of the thumbnail of the project `id`. */
const srcSetOf = id => `/${id}-480.webp 480w, /${id}-960.webp 960w`;

const project = (id, name, extra = {}) => ({
  id,
  name,
  type: 'Application web',
  thumbnails: thumbnailsOf(id),
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

/**
 * Makes `new Image()` record the images that the code creates, with the attributes it gives them,
 * in place of downloading them.
 */
const stubImages = () => {
  const images = [];
  vi.stubGlobal(
    'Image',
    class {
      constructor() {
        images.push(this);
      }
    },
  );
  return images;
};

/** Notice that screen readers read after the name of a card that links to its project. */
const NEW_TAB_NOTICE = '(nouvel onglet)';

/** Card of a project: the item of the grid that holds its name. */
const cardOf = name => screen.getByText(name).closest('li');

/** Element that lays out the cards: the list holding a card. */
const gridOf = name => cardOf(name).closest('ul');

/** Thumbnail of a card, found by the project name, an image that screen readers skip. */
const thumbnailOf = name => cardOf(name).querySelector('img');

/** Link of a card title, found by its name: the project name, then the notice of its new tab. */
const linkOf = name => screen.getByRole('link', { name: `${name} ${NEW_TAB_NOTICE}` });

/** List of the cards of the section, the first list, which holds the list of tools of each card. */
const cardList = () => screen.getAllByRole('list')[0];

/** Cards shown, in their order: the items of the list of cards, without the tools in them. */
const shownCards = () => [...cardList().children];

/** Name of a card, the text of its heading without the notice that only screen readers read. */
const cardNameOf = card => card.querySelector('h3')?.textContent.replace(NEW_TAB_NOTICE, '').trim();

/** Names of the cards shown, in their order. */
const shownCardNames = () => shownCards().map(cardNameOf);

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
    vi.useRealTimers();
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

      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
      expect(screen.getByRole('group')).not.toHaveAttribute('aria-labelledby');
    },
  );

  it('lists the cards, without a main landmark, which only the page renders', async () => {
    render(<Project projects={projects} />);
    expect(shownCards()).toHaveLength(ROW_CARD_COUNT);
    shownCards().forEach(card => expect(card.tagName).toBe('LI'));

    await userEvent.click(screen.getByText('Tout afficher (4)'));

    expect(shownCards()).toHaveLength(projects.length);
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
  });

  it('gives the cards an explicit list role, which Safari drops from lists without bullets', async () => {
    render(<Project projects={projects} />);

    expect(cardList()).toHaveAttribute('role', 'list');

    await userEvent.click(screen.getByText('Tout afficher (4)'));

    expect(cardList()).toHaveAttribute('role', 'list');
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
    expect(linkOf('Chess')).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getAllByRole('link')).toEqual([linkOf('Chess')]);
    expect(cardOf('Calculator')).toHaveTextContent('Calculator');
  });

  it('names each card with a level 3 heading, under the level 2 heading of the section', () => {
    render(
      <Project
        title="Projets personnels"
        projects={projects}
      />,
    );

    const cardHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(cardHeadings).toHaveLength(ROW_CARD_COUNT);
    expect(cardHeadings.map(heading => heading.closest('li'))).toEqual(shownCards());
    expect(screen.getByRole('heading', { level: 3, name: 'Calculator' })).toBeInTheDocument();
  });

  it('puts the link of a card in its heading, which tells that it opens a new tab', () => {
    render(<Project projects={projects} />);

    const heading = screen.getByRole('heading', { level: 3, name: `Chess ${NEW_TAB_NOTICE}` });
    expect(linkOf('Chess').parentElement).toBe(heading);
    expect(screen.getByText(NEW_TAB_NOTICE)).toHaveStyle({ position: 'absolute' });
  });

  it('tells in English that the link of a card opens a new tab once the language changes', async () => {
    render(<Project projects={projects} />);

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('link', { name: 'Chess (opens in a new tab)' })).toBeInTheDocument();
  });

  it('reads the name of a card once, its thumbnail being hidden from screen readers', () => {
    render(<Project projects={projects} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(thumbnailOf('Chess')).toHaveAttribute('alt', '');
    expect(screen.getAllByText('Chess')).toHaveLength(1);
  });

  it.each([undefined, '', '   '])('renders no empty heading for a card whose name is %j', name => {
    render(<Project projects={[project(9, name)]} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Application web')).toBeInTheDocument();
  });

  it('lists the tools of a card in their order, in a list with an explicit role', () => {
    render(<Project projects={[LONG_TECH_LINE_PROJECT]} />);

    const tools = within(cardOf(LONG_TECH_LINE_PROJECT.name)).getByRole('list');
    expect(tools).toHaveAttribute('role', 'list');
    expect(
      within(tools)
        .getAllByRole('listitem')
        .map(item => item.textContent),
    ).toEqual(LONG_TECH_LINE_PROJECT.tools);
  });

  it('separates the tools with a dot that screen readers skip, after every tool but the last', () => {
    render(<Project projects={[LONG_TECH_LINE_PROJECT]} />);

    const [firstTool] = within(cardOf(LONG_TECH_LINE_PROJECT.name)).getAllByRole('listitem');
    const separator = declaredStyle({
      element: firstTool,
      property: 'content',
      pseudo: ':not(:last-child)::after',
    });

    // Stylis drops the optional spaces around the slash
    expect(separator).toMatch(/^(['"]) · \1\s*\/\s*(['"])\2$/);
    expect(firstTool.textContent).toBe('HTML 5');
    expect(declaredStyle({ element: firstTool, property: 'display' })).toBe('inline');
  });

  it('lists each tool once, without the entries of the data that are not names', () => {
    render(
      <Project
        projects={[project(9, 'Draft', { tools: ['HTML 5', '', 42, null, 'HTML 5', 'Vite'] })]}
      />,
    );

    const tools = within(cardOf('Draft')).getAllByRole('listitem');
    expect(tools.map(item => item.textContent)).toEqual(['HTML 5', 'Vite']);
  });

  it.each([undefined, null, [], ['', '  '], 'HTML 5', { 0: 'HTML 5' }])(
    'shows no list of tools for the tools %j',
    tools => {
      render(<Project projects={[project(9, 'Draft', { tools })]} />);

      expect(within(cardOf('Draft')).queryByRole('list')).not.toBeInTheDocument();
      expect(cardOf('Draft')).toHaveTextContent('Application web');
    },
  );

  it('keeps the card itself, its thumbnail and its like button out of the link', () => {
    render(<Project projects={projects} />);

    expect(cardOf('Chess').tagName).toBe('LI');
    expect(cardOf('Chess').closest('a')).toBeNull();
    expect(thumbnailOf('Chess').closest('a')).toBeNull();
    expect(likeButtonOf('Chess').closest('a')).toBeNull();
    expect(linkOf('Chess')).toHaveTextContent(`Chess ${NEW_TAB_NOTICE}`, {
      normalizeWhitespace: true,
    });
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

  describe('thumbnails', () => {
    it('gives each thumbnail the files of its screenshot, for the browser to pick from', () => {
      render(<Project projects={projects} />);
      const thumbnail = thumbnailOf('Chess');

      expect(thumbnail).toHaveAttribute('srcset', srcSetOf(1));
      expect(thumbnail).toHaveAttribute('sizes', THUMBNAIL_SIZES);
      expect(thumbnail).toHaveAttribute('src', '/1-960.webp');
      expect(thumbnail).toHaveAttribute('width', '960');
      expect(thumbnail).toHaveAttribute('height', '600');
      expect(thumbnail).toHaveAttribute('decoding', 'async');
    });

    it.each([undefined, null, [], [{ url: '', width: 480, height: 300 }], 'chess.webp'])(
      'shows no image for the files %j, the card keeping its name and its like button',
      thumbnails => {
        render(<Project projects={[project(1, 'Chess', { thumbnails })]} />);

        expect(thumbnailOf('Chess')).toBeNull();
        expect(screen.getByRole('heading', { level: 3, name: 'Chess' })).toBeInTheDocument();
        expect(likeButtonOf('Chess')).toBeInTheDocument();
      },
    );

    it('downloads every thumbnail once the screen nears it, by default', () => {
      render(<Project projects={projects} />);

      cardList()
        .querySelectorAll('img')
        .forEach(thumbnail => {
          expect(thumbnail).toHaveAttribute('loading', 'lazy');
          expect(thumbnail).not.toHaveAttribute('fetchpriority');
        });
    });

    it('downloads the first thumbnail of a priority section at once, before the others', () => {
      render(
        <Project
          priority
          projects={projects}
        />,
      );
      const [first, ...others] = cardList().querySelectorAll('img');

      expect(first).toBe(thumbnailOf('Chess'));
      expect(first).toHaveAttribute('loading', 'eager');
      expect(first).toHaveAttribute('fetchpriority', 'high');
      others.forEach(thumbnail => {
        expect(thumbnail).toHaveAttribute('loading', 'lazy');
        expect(thumbnail).not.toHaveAttribute('fetchpriority');
      });
    });

    it('keeps the priority for the first project, not the first card of a later page', async () => {
      showWholeCards(1);
      render(
        <Project
          priority
          projects={projects}
        />,
      );

      await userEvent.click(pageButtons().nextButton);
      expect(thumbnailOf('Calculator')).toHaveAttribute('loading', 'lazy');
      expect(thumbnailOf('Calculator')).not.toHaveAttribute('fetchpriority');

      await userEvent.click(screen.getByRole('button', { name: 'Tout afficher (4)' }));
      expect(thumbnailOf('Chess')).toHaveAttribute('fetchpriority', 'high');
    });

    it('downloads the thumbnails of the next page once the pointer is over its arrow', async () => {
      showWholeCards(1);
      const images = stubImages();
      render(<Project projects={projects} />);

      await userEvent.hover(pageButtons().nextButton);

      expect(images.map(({ srcset }) => srcset)).toEqual([srcSetOf(2), srcSetOf(3), srcSetOf(4)]);
      images.forEach(image => {
        expect(image.sizes).toBe(THUMBNAIL_SIZES);
        expect(image.decoding).toBe('async');
      });
    });

    it('downloads the thumbnails of the next page once its arrow gets the focus', () => {
      showWholeCards(2);
      const images = stubImages();
      render(<Project projects={projects} />);

      act(() => pageButtons().nextButton.focus());

      expect(images.map(({ srcset }) => srcset)).toEqual([srcSetOf(3), srcSetOf(4)]);
    });

    it('downloads each thumbnail of the previous page once, even after the next ones', async () => {
      showWholeCards(1);
      const images = stubImages();
      render(<Project projects={projects} />);
      const { previousButton, nextButton } = pageButtons();

      await userEvent.click(nextButton);
      await userEvent.hover(previousButton);
      act(() => previousButton.focus());
      await userEvent.hover(nextButton);

      // The previous page, from Chess, adds only Chess to the next one, from Calculator
      expect(images.map(({ srcset }) => srcset)).toEqual([
        srcSetOf(2),
        srcSetOf(3),
        srcSetOf(4),
        srcSetOf(1),
      ]);
    });

    it('downloads nothing for the projects of the next page without a valid file', async () => {
      showWholeCards(1);
      const images = stubImages();
      render(
        <Project
          projects={[
            project(1, 'Chess'),
            project(2, 'Calculator', { thumbnails: undefined }),
            project(3, 'Plugin store', { thumbnails: [{ url: '/3.webp' }] }),
          ]}
        />,
      );

      await userEvent.hover(pageButtons().nextButton);

      expect(images).toEqual([]);
    });
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
      const firstCardName = () => shownCardNames()[0];

      expect(firstCardName()).toBe(firstCardOfEachPage[0]);
      for (const name of firstCardOfEachPage.slice(1)) {
        await userEvent.click(nextButton);
        expect(firstCardName()).toBe(name);
      }
      expect(nextButton).toHaveAttribute('aria-disabled', 'true');

      for (const name of firstCardOfEachPage.slice(0, -1).reverse()) {
        await userEvent.click(previousButton);
        expect(firstCardName()).toBe(name);
      }
      expect(previousButton).toHaveAttribute('aria-disabled', 'true');
    },
  );

  it('keeps three cards in the row, the next ones scrolled to, when it shows fewer whole', async () => {
    showWholeCards(1);
    render(<Project projects={projects} />);

    await userEvent.click(pageButtons().nextButton);

    const cards = shownCards();
    expect(cards).toHaveLength(ROW_CARD_COUNT);
    expect(cards[0]).toHaveTextContent('Calculator');
  });

  it('shows the last page once the screen widens past the page shown', async () => {
    showWholeCards(1);
    const { rerender } = render(<Project projects={projects} />);
    const { nextButton } = pageButtons();
    for (let page = 1; page < projects.length; page += 1) await userEvent.click(nextButton);
    expect(shownCardNames()).toEqual(['Connect Four']);

    // Two cards shown whole: the last page starts on the third project
    showWholeCards(2);
    rerender(<Project projects={projects} />);

    expect(shownCardNames()).toEqual(['Plugin store', 'Connect Four']);
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
    expect(shownCardNames()).toEqual(['Connect Four']);
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

  it('shows no list of tools for a project without tools', () => {
    render(<Project projects={[TOOLLESS_PROJECT]} />);

    expect(within(cardOf(TOOLLESS_PROJECT.name)).queryByRole('list')).not.toBeInTheDocument();
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

    it('scales the cards and the title up from the wide breakpoint, with the app container', () => {
      render(
        <Project
          title="Projets personnels"
          projects={projects}
        />,
      );
      const card = within(cardOf('Chess'));
      const sizesOf = ({ element, property }) => ({
        belowWide: declaredStyle({ element, property }),
        wide: declaredStyle({ element, property, media: WIDE_MEDIA }),
      });

      expect(sizesOf({ element: thumbnailOf('Chess').parentElement, property: 'height' })).toEqual({
        belowWide: theme.sizes[222],
        wide: theme.sizes[248],
      });
      expect(
        sizesOf({ element: card.getByRole('heading', { level: 3 }), property: 'font-size' }),
      ).toEqual({ belowWide: theme.fontSizes[16], wide: theme.fontSizes[18] });
      for (const metadata of [card.getByText('Application web'), card.getByRole('list')]) {
        expect(sizesOf({ element: metadata, property: 'font-size' })).toEqual({
          belowWide: theme.fontSizes[13],
          wide: theme.fontSizes[15],
        });
      }
      expect(
        declaredStyle({
          element: screen.getByRole('heading', { level: 2 }),
          property: 'font-size',
          media: WIDE_MEDIA,
        }),
      ).toBe(theme.fontSizes[44]);
    });

    it('stretches the title link over its card, above the thumbnail and under the like button', () => {
      render(<Project projects={projects} />);

      const linkLayer = property =>
        declaredStyle({ element: linkOf('Chess'), property, pseudo: '::after' });
      const thumbnailOverlay = thumbnailOf('Chess').parentElement;
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
      const lastTransformRuleIndex = ({ state, media = '' }) => {
        const stateSelectors = [...likeButton.classList].map(className => `.${className}${state}`);
        return listStyleRules().findLastIndex(entry => {
          const isRuleOfState =
            entry.media === media && stateSelectors.includes(entry.rule.selectorText);
          // Also skips the @keyframes rules, which have no style
          if (!isRuleOfState) return false;
          return entry.rule.style.getPropertyValue('transform') !== '';
        });
      };
      const hoverRuleIndex = lastTransformRuleIndex({
        state: ':hover',
        media: HOVER_POINTER_QUERY,
      });

      expect(
        declaredStyle({
          element: likeButton,
          property: 'transform',
          pseudo: ':hover',
          media: HOVER_POINTER_QUERY,
        }),
      ).toBe('scale(1.06)');
      expect(declaredStyle({ element: likeButton, property: 'transform', pseudo: ':active' })).toBe(
        'scale(0.93)',
      );
      // A pressed button is hovered too: the rule of :active must come last to win
      expect(hoverRuleIndex).toBeGreaterThan(-1);
      expect(lastTransformRuleIndex({ state: ':active' })).toBeGreaterThan(hoverRuleIndex);
    });

    it('plays the pop animation of the heart for exactly as long as its button stays animated', () => {
      vi.useFakeTimers();
      render(<Project projects={projects} />);
      // jsdom keeps the `animation` shorthand as written, without filling its longhands
      const heartAnimation = () =>
        getComputedStyle(likeButtonOf('Chess').querySelector('svg')).getPropertyValue('animation');

      expect(heartAnimation()).toBe('');
      fireEvent.click(likeButtonOf('Chess'));
      expect(heartAnimation().split(' ')).toContain(`${LIKE_ANIMATION_MS}ms`);

      act(() => vi.advanceTimersByTime(LIKE_ANIMATION_MS - 1));
      expect(heartAnimation()).not.toBe('');

      act(() => vi.advanceTimersByTime(1));
      expect(heartAnimation()).toBe('');
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

    // The button lies over the thumbnail, whose colors the gradient and the glow of the card only
    // dim or lighten: a white and a black thumbnail are the worst cases for a light heart
    it.each([
      ['white', '#ffffff'],
      ['black', '#000000'],
    ])(
      'keeps the heart at 3:1 against its button over a %s thumbnail, at rest, hovered and liked',
      (_thumbnail, thumbnailColor) => {
        storeLikedIds([1]);
        render(<Project projects={projects} />);
        // Value of the state, or of the rest state that it does not change
        const stateStyle = ({ button, property, pseudo }) => {
          const media = pseudo.includes(':hover') ? HOVER_POINTER_QUERY : '';
          return (
            declaredStyle({ element: button, property, pseudo, media }) ||
            declaredStyle({ element: button, property, pseudo: pseudo.replace(':hover', '') })
          );
        };
        const heartContrast = ({ button, state }) => {
          const fill = stateStyle({ button, property: 'background-color', pseudo: state });
          const heart = stateStyle({ button, property: 'stroke', pseudo: `${state} > svg` });
          const background = blendColors({ foreground: fill, background: thumbnailColor });
          return getContrastRatio({ foreground: heart, background });
        };
        const restButton = likeButtonOf('Calculator');
        const likedButton = likeButtonOf('Chess');

        expect(heartContrast({ button: restButton, state: '' })).toBeGreaterThanOrEqual(
          MIN_ICON_CONTRAST_RATIO,
        );
        expect(heartContrast({ button: restButton, state: ':hover' })).toBeGreaterThanOrEqual(
          MIN_ICON_CONTRAST_RATIO,
        );
        expect(heartContrast({ button: likedButton, state: '' })).toBeGreaterThanOrEqual(
          MIN_ICON_CONTRAST_RATIO,
        );
        expect(heartContrast({ button: likedButton, state: ':hover' })).toBeGreaterThanOrEqual(
          MIN_ICON_CONTRAST_RATIO,
        );
      },
    );

    it('fills the heart of a liked project in the color of a selection in forced colors mode', () => {
      storeLikedIds([1]);
      render(<Project projects={projects} />);
      const forcedHeartStyle = ({
        button,
        property,
        pseudo = '>svg',
        media = FORCED_COLORS_MEDIA,
      }) => declaredStyle({ element: button, property, media, pseudo });

      // Forced colors mode keeps the colors of an SVG but empties the background of its button
      expect(forcedHeartStyle({ button: likeButtonOf('Chess'), property: 'fill' })).toBe(
        'highlight',
      );
      expect(forcedHeartStyle({ button: likeButtonOf('Chess'), property: 'stroke' })).toBe(
        'highlight',
      );
      expect(forcedHeartStyle({ button: likeButtonOf('Calculator'), property: 'fill' })).toBe(
        'transparent',
      );
      expect(forcedHeartStyle({ button: likeButtonOf('Calculator'), property: 'stroke' })).toBe(
        'buttontext',
      );
      // Hovered, the heart keeps the colors of forced colors mode
      expect(
        forcedHeartStyle({
          button: likeButtonOf('Calculator'),
          property: 'stroke',
          pseudo: ':hover > svg',
          media: `${FORCED_COLORS_MEDIA} and ${HOVER_POINTER_QUERY}`,
        }),
      ).toBe('buttontext');
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
      const arrowStyle = ({ property, pseudo, media = '' }) =>
        declaredStyle({ element: previousButton, property, pseudo, media });
      const hoverColor = pseudo =>
        arrowStyle({ property: 'background-color', pseudo, media: HOVER_POINTER_QUERY });

      expect(arrowStyle({ property: 'opacity', pseudo: disabledState })).toBe('0.4');
      expect(arrowStyle({ property: 'cursor', pseudo: disabledState })).toBe('default');
      expect(hoverColor(`:hover:not(${disabledState})`)).toBe(
        serializeCssValue({ property: 'background-color', value: theme.colors.accent }),
      );
      // A hover color for every state would light up the disabled arrow too
      expect(hoverColor(':hover')).toBe(UNDECLARED);
      // A touch screen would keep the hover color of the arrow tapped last
      expect(
        arrowStyle({ property: 'background-color', pseudo: `:hover:not(${disabledState})` }),
      ).toBe(UNDECLARED);
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

      const techLine = within(cardOf(LONG_TECH_LINE_PROJECT.name)).getByRole('list');
      expect(inheritedWhiteSpace(techLine)).toBe('normal');
    });
  });
});
