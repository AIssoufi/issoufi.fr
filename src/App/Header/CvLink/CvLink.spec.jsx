import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../../i18n';
import CvLink from './CvLink';

const CV_URL = '/CV - Adam Issoufi.pdf';

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

  describe('accessibility', () => {
    it('hides the icon from screen readers, which read the name of the link', () => {
      render(<CvLink hasIcon />);
      expect(getLink().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('names the link in English once English is active, still holding the visible "CV"', async () => {
      render(<CvLink />);

      await act(() => i18n.changeLanguage('en'));

      const link = screen.getByRole('link', { name: 'Download the CV' });
      expect(link).toHaveAttribute('href', CV_URL);
      expect(link).toHaveTextContent(/^CV$/);
    });
  });
});
