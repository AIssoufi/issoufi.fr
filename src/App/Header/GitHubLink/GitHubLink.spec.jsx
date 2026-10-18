import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../../i18n';
import { declaredStyle, serializeCssValue } from '../../../styleTestUtils';
import { theme } from '../../../theme';
import GitHubLink from './GitHubLink';

const GITHUB_PROFILE_URL = 'https://github.com/AIssoufi';

const getLink = () => screen.getByRole('link', { name: 'Profil GitHub d’ADAM Issoufi' });

describe('GitHubLink', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders the GitHub icon without any props', () => {
    render(<GitHubLink />);
    expect(getLink().querySelector('svg')).toBeInTheDocument();
  });

  it('opens the GitHub profile of the owner in a new tab, without giving it access to the site', () => {
    render(<GitHubLink />);

    expect(getLink()).toHaveAttribute('href', GITHUB_PROFILE_URL);
    expect(getLink()).toHaveAttribute('target', '_blank');
    expect(getLink()).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('calls onClick when it is clicked', async () => {
    const onClick = vi.fn(event => event.preventDefault());
    render(<GitHubLink onClick={onClick} />);

    await userEvent.click(getLink());

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps the class name it receives', () => {
    render(<GitHubLink className="in-menu" />);
    expect(getLink()).toHaveClass('in-menu');
  });

  describe('accessibility', () => {
    it('hides the icon from screen readers, which read the name of the link', () => {
      render(<GitHubLink />);
      expect(getLink().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('names the link in English once English is active', async () => {
      render(<GitHubLink />);

      await act(() => i18n.changeLanguage('en'));

      expect(screen.getByRole('link', { name: "ADAM Issoufi's GitHub profile" })).toHaveAttribute(
        'href',
        GITHUB_PROFILE_URL,
      );
    });
  });

  describe('styles', () => {
    it.each(['border', 'border-radius', 'background', 'box-shadow', 'padding'])(
      'shows the icon alone, without any %s around it',
      property => {
        render(<GitHubLink />);
        expect(declaredStyle({ element: getLink(), property })).toBe('');
      },
    );

    it('draws the icon light grey, at the height of a button of the language toggle', () => {
      render(<GitHubLink />);

      expect(getComputedStyle(getLink()).color).toBe(theme.colors['foreground-a65']);
      expect(getComputedStyle(getLink().querySelector('svg')).height).toBe(theme.sizes[32]);
    });

    it('turns to the accent color of the buttons on hover', () => {
      render(<GitHubLink />);

      const hoverColor = declaredStyle({ element: getLink(), property: 'color', pseudo: ':hover' });
      expect(hoverColor).toBe(serializeCssValue({ property: 'color', value: theme.colors.accent }));
    });
  });
});
