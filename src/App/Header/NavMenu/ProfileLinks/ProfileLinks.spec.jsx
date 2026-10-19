import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DESKTOP_MEDIA_QUERY } from '../../constants';
import i18n from '../../../../i18n';
import { declaredStyle, serializeCssValue } from '../../../../styleTestUtils';
import { theme } from '../../../../theme';
import ProfileLinks from './ProfileLinks';

/** Each profile of the site owner: the name of its link in each language, and its URL. */
const PROFILES = [
  {
    name: 'Profil GitHub d’ADAM Issoufi',
    englishName: "ADAM Issoufi's GitHub profile",
    url: 'https://github.com/AIssoufi',
  },
  {
    name: 'Profil LinkedIn d’ADAM Issoufi',
    englishName: "ADAM Issoufi's LinkedIn profile",
    url: 'https://www.linkedin.com/in/issoufiadam',
  },
];

const [GITHUB, LINKEDIN] = PROFILES;

const getLink = name => screen.getByRole('link', { name });

describe('ProfileLinks', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders the GitHub then the LinkedIn icon without any props', () => {
    render(<ProfileLinks />);

    const links = screen.getAllByRole('link');
    expect(links).toEqual([getLink(GITHUB.name), getLink(LINKEDIN.name)]);
    links.forEach(link => expect(link.querySelector('svg')).toBeInTheDocument());
  });

  it('puts both icons on one row', () => {
    render(<ProfileLinks />);

    const row = getLink(GITHUB.name).parentElement;
    expect(row).toBe(getLink(LINKEDIN.name).parentElement);
    expect(getComputedStyle(row).display).toBe('flex');
    expect(getComputedStyle(row).flexDirection).toBe('row');
  });

  it.each(PROFILES)(
    'opens $url in a new tab, without giving it access to the site',
    ({ name, url }) => {
      render(<ProfileLinks />);

      expect(getLink(name)).toHaveAttribute('href', url);
      expect(getLink(name)).toHaveAttribute('target', '_blank');
      expect(getLink(name)).toHaveAttribute('rel', 'noopener noreferrer');
    },
  );

  it.each(PROFILES)('calls onClick when $name is clicked', async ({ name }) => {
    const onClick = vi.fn(event => event.preventDefault());
    render(<ProfileLinks onClick={onClick} />);

    await userEvent.click(getLink(name));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('can be clicked without onClick', async () => {
    // A new tab would be a navigation, which jsdom does not do: the click is stopped before
    const preventNavigation = vi.fn(event => event.preventDefault());
    window.addEventListener('click', preventNavigation, { capture: true });
    try {
      render(<ProfileLinks />);

      await userEvent.click(getLink(LINKEDIN.name));

      expect(preventNavigation).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener('click', preventNavigation, { capture: true });
    }
  });

  it('keeps the class name it receives on the row', () => {
    render(<ProfileLinks className="in-menu" />);
    expect(getLink(GITHUB.name).parentElement).toHaveClass('in-menu');
  });

  describe('accessibility', () => {
    it.each(PROFILES)(
      'hides the icon of $name from screen readers, which read the name of the link',
      ({ name }) => {
        render(<ProfileLinks />);
        expect(getLink(name).querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      },
    );

    it('names the links in English once English is active', async () => {
      render(<ProfileLinks />);

      await act(() => i18n.changeLanguage('en'));

      PROFILES.forEach(({ englishName, url }) =>
        expect(getLink(englishName)).toHaveAttribute('href', url),
      );
    });
  });

  describe('styles', () => {
    it.each(['border', 'border-radius', 'background', 'box-shadow', 'padding'])(
      'shows each icon alone, without any %s around it',
      property => {
        render(<ProfileLinks />);
        PROFILES.forEach(({ name }) =>
          expect(declaredStyle({ element: getLink(name), property })).toBe(''),
        );
      },
    );

    it('draws the icons light grey, and large in the mobile menu', () => {
      render(<ProfileLinks />);

      PROFILES.forEach(({ name }) => {
        expect(getComputedStyle(getLink(name)).color).toBe(theme.colors['foreground-a65']);
        expect(getComputedStyle(getLink(name).querySelector('svg')).height).toBe(theme.sizes[32]);
      });
    });

    it('makes the icons as high as the text of the links in the bar of the header on desktop', () => {
      render(<ProfileLinks />);

      // The rule sets the height of the icon inside the link
      const iconHeight = declaredStyle({
        element: getLink(LINKEDIN.name),
        property: 'height',
        media: DESKTOP_MEDIA_QUERY,
        pseudo: ' svg',
      });
      expect(iconHeight).toBe(theme.fontSizes[15]);
    });

    it('turns an icon to the accent color of the buttons on hover', () => {
      render(<ProfileLinks />);

      const hoverColor = declaredStyle({
        element: getLink(GITHUB.name),
        property: 'color',
        pseudo: ':hover',
      });
      expect(hoverColor).toBe(serializeCssValue({ property: 'color', value: theme.colors.accent }));
    });
  });
});
