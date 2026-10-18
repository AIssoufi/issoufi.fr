import { act, render, screen } from '@testing-library/react';

import packageJson from '../../../package.json';
import i18n from '../../i18n';
import { theme } from '../../theme';
import { BUTTON_HEIGHT_PX, BUTTON_WIDTH_PX } from '../constants';
import SiteBadge from './SiteBadge';

const GITHUB_PROFILE_URL = 'https://github.com/AIssoufi';

const getGitHubLink = () => screen.getByRole('link', { name: 'Profil GitHub d’ADAM Issoufi' });

describe('SiteBadge', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders the GitHub button and the version of the build without any props', () => {
    render(<SiteBadge />);

    expect(getGitHubLink()).toBeInTheDocument();
    expect(screen.getByText(`issoufi.fr v${packageJson.version}`)).toBeInTheDocument();
  });

  it('opens the GitHub profile of the owner in a new tab, without giving it access to the site', () => {
    render(<SiteBadge />);

    expect(getGitHubLink()).toHaveAttribute('href', GITHUB_PROFILE_URL);
    expect(getGitHubLink()).toHaveAttribute('target', '_blank');
    expect(getGitHubLink()).toHaveAttribute('rel', 'noopener noreferrer');
  });

  describe('version', () => {
    it.each([
      ['2.3.4', 'issoufi.fr v2.3.4'],
      ['v2.3.4', 'issoufi.fr v2.3.4'],
      [' 2.3.4 ', 'issoufi.fr v2.3.4'],
    ])('shows the version %j as %j', (version, text) => {
      render(<SiteBadge version={version} />);
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('shows the version of the build when the version is undefined', () => {
      render(<SiteBadge version={undefined} />);
      expect(screen.getByText(`issoufi.fr v${packageJson.version}`)).toBeInTheDocument();
    });

    it.each(['', '   ', 'v', null, 2])(
      'shows the site name alone when the version is %j',
      version => {
        render(<SiteBadge version={version} />);
        expect(screen.getByText('issoufi.fr')).toBeInTheDocument();
        expect(screen.queryByText(/undefined|null|NaN/)).not.toBeInTheDocument();
      },
    );
  });

  describe('accessibility', () => {
    it('is the footer landmark of the site, holding the button and the version', () => {
      render(<SiteBadge />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toContainElement(getGitHubLink());
      expect(footer).toHaveTextContent(`issoufi.fr v${packageJson.version}`);
    });

    it('hides the GitHub mark from screen readers, which read the name of the button', () => {
      render(<SiteBadge />);
      expect(getGitHubLink().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('names the GitHub button in English once English is active', async () => {
      render(<SiteBadge />);

      await act(() => i18n.changeLanguage('en'));

      expect(screen.getByRole('link', { name: "ADAM Issoufi's GitHub profile" })).toHaveAttribute(
        'href',
        GITHUB_PROFILE_URL,
      );
    });
  });

  describe('layout', () => {
    it('stays in the bottom left corner of the screen while the page scrolls, above the content', () => {
      // jsdom applies no media query: the corner is the same at every width
      render(<SiteBadge />);

      const footerStyle = getComputedStyle(screen.getByRole('contentinfo'));
      expect(footerStyle.position).toBe('fixed');
      expect(footerStyle.left).toBe(theme.space[20]);
      expect(footerStyle.bottom).toBe(theme.space[20]);
      expect(footerStyle.zIndex).toBe(String(theme.zIndices.overlay));
    });

    it('gives the GitHub button the size of a button of the language toggle', () => {
      render(<SiteBadge />);

      const linkStyle = getComputedStyle(getGitHubLink());
      expect(linkStyle.width).toBe(`${BUTTON_WIDTH_PX}px`);
      expect(linkStyle.height).toBe(`${BUTTON_HEIGHT_PX}px`);
    });
  });
});
