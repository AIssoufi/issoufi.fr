import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../../../i18n';
import { isPublicFile } from '../../../../pages/testUtils';
import { CV_URLS } from './constants';
import CvLink from './CvLink';

/** CV written in French, the default language. */
const CV_URL = '/CV - Adam Issoufi.pdf';

/** CV written in English. */
const ENGLISH_CV_URL = '/CV - Adam Issoufi (EN).pdf';

const getLink = () => screen.getByRole('link', { name: 'Télécharger CV' });

describe('CvLink', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders the text "Télécharger CV" without any props, and no icon', () => {
    render(<CvLink />);

    expect(getLink()).toHaveTextContent(/^Télécharger CV$/);
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

  it('downloads the CV written in English once English is active, and says so in English', async () => {
    render(<CvLink />);

    await act(() => i18n.changeLanguage('en'));

    const link = screen.getByRole('link', { name: 'Download CV' });
    expect(link).toHaveAttribute('href', ENGLISH_CV_URL);
    expect(link).toHaveTextContent(/^Download CV$/);
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
    expect(getLink()).toHaveTextContent(/^Télécharger CV$/);
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

  describe('accessibility', () => {
    it('is named by its text alone, with no tooltip, label or description', () => {
      render(<CvLink hasIcon />);

      expect(getLink()).toHaveAccessibleName('Télécharger CV');
      expect(getLink()).not.toHaveAttribute('aria-label');
      expect(getLink()).not.toHaveAttribute('aria-labelledby');
      expect(getLink()).not.toHaveAccessibleDescription();
      expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
    });

    it('hides the icon from screen readers, which read the text of the link', () => {
      render(<CvLink hasIcon />);
      expect(getLink().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
