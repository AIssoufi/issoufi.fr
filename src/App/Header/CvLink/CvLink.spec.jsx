import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../../i18n';
import { isPublicFile } from '../../../pages/testUtils';
import { declaredStyle, serializeCssValue } from '../../../styleTestUtils';
import { theme } from '../../../theme';
import { CV_URLS } from './constants';
import CvLink from './CvLink';

/** CV written in French, the default language. */
const CV_URL = '/CV - Adam Issoufi.pdf';

/** CV written in English. */
const ENGLISH_CV_URL = '/CV - Adam Issoufi (EN).pdf';

const getLink = () => screen.getByRole('link', { name: 'Télécharger le CV' });

describe('CvLink', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders the text "CV" without any props, and no icon', () => {
    render(<CvLink />);

    expect(getLink()).toHaveTextContent(/^CV$/);
    expect(getLink().querySelector('svg')).not.toBeInTheDocument();
  });

  it('downloads the CV rather than opening it', () => {
    render(<CvLink />);

    expect(getLink()).toHaveAttribute('href', CV_URL);
    expect(getLink()).toHaveAttribute('download');
    expect(getLink()).not.toHaveAttribute('target');
  });

  it.each(Object.entries(CV_URLS))('serves the %s CV from public/', (_language, url) => {
    expect(isPublicFile(url)).toBe(true);
  });

  it('downloads the CV written in English once English is active', async () => {
    render(<CvLink />);

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('link', { name: 'Download the CV' })).toHaveAttribute(
      'href',
      ENGLISH_CV_URL,
    );
  });

  it('goes back to the French CV once French is active again', async () => {
    render(<CvLink />);

    await act(() => i18n.changeLanguage('en'));
    await act(() => i18n.changeLanguage('fr'));

    expect(getLink()).toHaveAttribute('href', CV_URL);
  });

  it('shows a download icon before the text when asked to', () => {
    render(<CvLink hasIcon />);

    const icon = getLink().querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(getLink().firstChild).toBe(icon);
    expect(getLink()).toHaveTextContent(/^CV$/);
  });

  it('calls onClick when it is clicked', async () => {
    const onClick = vi.fn(event => event.preventDefault());
    render(<CvLink onClick={onClick} />);

    await userEvent.click(getLink());

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('can be clicked without onClick', async () => {
    // jsdom cannot download a file: the click is stopped before it tries. An error thrown while
    // React handles the click would be logged with console.error, which fails the test
    const preventNavigation = vi.fn(event => event.preventDefault());
    window.addEventListener('click', preventNavigation, { capture: true });
    try {
      render(<CvLink />);

      await userEvent.click(getLink());

      expect(preventNavigation).toHaveBeenCalledOnce();
      expect(preventNavigation.mock.calls[0][0].target).toBe(getLink());
    } finally {
      window.removeEventListener('click', preventNavigation, { capture: true });
    }
  });

  it.each([
    ['false', false],
    ['undefined', undefined],
  ])('shows no icon when hasIcon is %s', (_case, hasIcon) => {
    render(<CvLink hasIcon={hasIcon} />);
    expect(getLink().querySelector('svg')).not.toBeInTheDocument();
  });

  it('keeps the class name it receives', () => {
    render(<CvLink className="in-menu" />);
    expect(getLink()).toHaveClass('in-menu');
  });

  describe('tooltip', () => {
    /** The tooltip of the link, found even while it is hidden. */
    const getTooltip = () => screen.getByRole('tooltip', { hidden: true });

    it('says what the link does while the mouse hovers it', async () => {
      render(<CvLink />);
      expect(getTooltip()).not.toBeVisible();

      await userEvent.hover(getLink());
      expect(getTooltip()).toBeVisible();
      expect(getTooltip()).toHaveTextContent(/^Télécharger le CV$/);

      await userEvent.unhover(getLink());
      expect(getTooltip()).not.toBeVisible();
    });

    it('shows while the keyboard focuses the link, until Escape', async () => {
      render(<CvLink />);

      await userEvent.tab();
      expect(getLink()).toHaveFocus();
      expect(getTooltip()).toBeVisible();

      await userEvent.keyboard('{Escape}');
      expect(getLink()).toHaveFocus();
      expect(getTooltip()).not.toBeVisible();
    });

    it('names the link for screen readers, whether it shows or not, which then read it once', () => {
      render(<CvLink />);
      expect(getTooltip()).not.toBeVisible();

      expect(getLink()).toHaveAttribute('aria-labelledby', getTooltip().id);
      expect(getLink()).toHaveAccessibleName('Télécharger le CV');
      expect(getLink()).not.toHaveAttribute('aria-label');
      expect(getLink()).not.toHaveAttribute('aria-describedby');
      expect(getLink()).not.toHaveAccessibleDescription();
    });

    it('sits next to the link, outside of it, so the link still reads "CV"', () => {
      render(<CvLink hasIcon />);

      expect(getLink()).not.toContainElement(getTooltip());
      expect(getLink().nextElementSibling).toBe(getTooltip());
      expect(getLink()).toHaveTextContent(/^CV$/);
    });

    it.each([
      ['above the link by default', undefined, 'bottom'],
      ['on the left of the link when asked to', 'left', 'right'],
      ['above the link when asked to', 'top', 'bottom'],
    ])('shows %s', (_case, tooltipPlacement, sideTowardsLink) => {
      render(<CvLink tooltipPlacement={tooltipPlacement} />);

      expect(declaredStyle({ element: getTooltip(), property: sideTowardsLink })).toBe(
        serializeCssValue({
          property: sideTowardsLink,
          value: `calc(100% + ${theme.space['tooltip-gap']})`,
        }),
      );
    });

    it('is written in English once English is active', async () => {
      render(<CvLink />);

      await act(() => i18n.changeLanguage('en'));

      expect(getTooltip()).toHaveTextContent(/^Download the CV$/);
      expect(screen.getByRole('link', { name: 'Download the CV' })).toHaveAttribute(
        'aria-labelledby',
        getTooltip().id,
      );
    });
  });

  describe('accessibility', () => {
    it('hides the icon from screen readers, which read the name of the link', () => {
      render(<CvLink hasIcon />);
      expect(getLink().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('names the link in English once English is active, still holding the visible "CV"', async () => {
      render(<CvLink />);

      await act(() => i18n.changeLanguage('en'));

      const link = screen.getByRole('link', { name: 'Download the CV' });
      expect(link).toHaveAttribute('href', ENGLISH_CV_URL);
      expect(link).toHaveTextContent(/^CV$/);
    });
  });
});
