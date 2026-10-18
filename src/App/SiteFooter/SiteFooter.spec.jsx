import { act, render, screen } from '@testing-library/react';

import packageJson from '../../../package.json';
import i18n from '../../i18n';
import { declaredStyle } from '../../styleTestUtils';
import { theme } from '../../theme';
import SiteFooter from './SiteFooter';

const GITHUB_PROFILE_URL = 'https://github.com/AIssoufi';

const getGitHubLink = () => screen.getByRole('link', { name: 'Profil GitHub d’ADAM Issoufi' });
const getFooter = () => screen.getByRole('contentinfo');

describe('SiteFooter', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders the version of the build and the GitHub icon without any props', () => {
    render(<SiteFooter />);

    expect(screen.getByText(`v${packageJson.version}`)).toBeInTheDocument();
    expect(getGitHubLink()).toBeInTheDocument();
  });

  it('shows the version alone, without the name of the site', () => {
    render(<SiteFooter version="2.0.0" />);
    expect(screen.getByText('v2.0.0')).toBeInTheDocument();
    expect(getFooter()).not.toHaveTextContent('issoufi.fr');
  });

  it('opens the GitHub profile of the owner in a new tab, without giving it access to the site', () => {
    render(<SiteFooter />);

    expect(getGitHubLink()).toHaveAttribute('href', GITHUB_PROFILE_URL);
    expect(getGitHubLink()).toHaveAttribute('target', '_blank');
    expect(getGitHubLink()).toHaveAttribute('rel', 'noopener noreferrer');
  });

  describe('version', () => {
    it.each([
      ['2.3.4', 'v2.3.4'],
      ['v2.3.4', 'v2.3.4'],
      [' 2.3.4 ', 'v2.3.4'],
    ])('shows the version %j as %j', (version, text) => {
      render(<SiteFooter version={version} />);
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('shows the version of the build when the version is undefined', () => {
      render(<SiteFooter version={undefined} />);
      expect(screen.getByText(`v${packageJson.version}`)).toBeInTheDocument();
    });

    it.each(['', '   ', 'v', null, 2])(
      'shows no version, but still the GitHub icon, when the version is %j',
      version => {
        render(<SiteFooter version={version} />);

        expect(getFooter()).toHaveTextContent('');
        expect(getGitHubLink()).toBeInTheDocument();
      },
    );
  });

  describe('accessibility', () => {
    it('is the footer landmark of the site, holding the version and the GitHub icon', () => {
      render(<SiteFooter />);

      expect(getFooter()).toContainElement(getGitHubLink());
      expect(getFooter()).toHaveTextContent(`v${packageJson.version}`);
    });

    it('hides the GitHub icon from screen readers, which read the name of the link', () => {
      render(<SiteFooter />);
      expect(getGitHubLink().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('names the GitHub link in English once English is active', async () => {
      render(<SiteFooter />);

      await act(() => i18n.changeLanguage('en'));

      expect(screen.getByRole('link', { name: "ADAM Issoufi's GitHub profile" })).toHaveAttribute(
        'href',
        GITHUB_PROFILE_URL,
      );
    });
  });

  describe('layout', () => {
    it('stays at the bottom of the screen while the page scrolls, above the content', () => {
      // jsdom applies no media query: the footer is the same at every width
      render(<SiteFooter />);

      const footerStyle = getComputedStyle(getFooter());
      expect(footerStyle.position).toBe('fixed');
      expect(footerStyle.left).toBe('0px');
      expect(footerStyle.right).toBe('0px');
      expect(footerStyle.bottom).toBe(theme.space[20]);
      expect(footerStyle.zIndex).toBe(String(theme.zIndices.overlay));
    });

    it('lets the clicks through, except on the version and the GitHub icon', () => {
      render(<SiteFooter />);

      expect(getComputedStyle(getFooter()).pointerEvents).toBe('none');
      expect(getComputedStyle(getGitHubLink()).pointerEvents).toBe('auto');
      expect(getComputedStyle(screen.getByText(`v${packageJson.version}`)).pointerEvents).toBe(
        'auto',
      );
    });

    it('lines its content up with the header: the width and the gutters of the app container', () => {
      render(<SiteFooter />);

      const contentStyle = getComputedStyle(getFooter().firstElementChild);
      expect(contentStyle.maxWidth).toBe(theme.sizes.container);
      expect(contentStyle.paddingLeft).toBe(theme.space.page);
      expect(contentStyle.paddingRight).toBe(theme.space.page);
    });

    it('pushes the GitHub icon to the right end, even without a version', () => {
      render(<SiteFooter version="" />);
      expect(getComputedStyle(getGitHubLink()).marginLeft).toBe('auto');
    });

    it.each(['border', 'border-radius', 'background', 'box-shadow', 'padding'])(
      'shows the GitHub icon alone, without any %s around it',
      property => {
        render(<SiteFooter />);
        expect(declaredStyle({ element: getGitHubLink(), property })).toBe('');
      },
    );

    it('draws the GitHub icon at the height of a button of the language toggle', () => {
      render(<SiteFooter />);
      expect(getComputedStyle(getGitHubLink().querySelector('svg')).height).toBe(theme.sizes[32]);
    });
  });
});
