import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../i18n';
import VisuallyHidden from '../VisuallyHidden';
import NewTabLink from './NewTabLink';

const URL = 'https://github.com/AIssoufi';

describe('NewTabLink', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders nothing without any props', () => {
    const { container } = render(<NewTabLink />);

    expect(container).toBeEmptyDOMElement();
  });

  it.each([undefined, null, '', '   ', 42])(
    'renders its content alone, with no link nor notice, for the href %j',
    href => {
      const { container } = render(<NewTabLink href={href}>GitHub</NewTabLink>);

      expect(container.querySelector('a')).not.toBeInTheDocument();
      expect(container).toHaveTextContent(/^GitHub$/);
    },
  );

  it('names the link after its content, then tells that it opens a new tab', () => {
    render(<NewTabLink href={URL}>GitHub</NewTabLink>);

    expect(screen.getByRole('link')).toHaveAccessibleName('GitHub (nouvel onglet)');
    expect(screen.getByRole('link')).toHaveAttribute('href', URL);
  });

  it('tells it in English once the language changes', async () => {
    render(<NewTabLink href={URL}>GitHub</NewTabLink>);

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('link')).toHaveAccessibleName('GitHub (opens in a new tab)');
  });

  it('shows the notice to screen readers only', () => {
    render(<NewTabLink href={URL}>GitHub</NewTabLink>);

    expect(screen.getByText('(nouvel onglet)')).toHaveStyle({
      position: 'absolute',
      width: '1px',
      height: '1px',
      clipPath: 'inset(50%)',
    });
  });

  it('names a link whose icon is hidden after its hidden text', () => {
    render(
      <NewTabLink href={URL}>
        <svg aria-hidden />
        <VisuallyHidden>Profil GitHub</VisuallyHidden>
      </NewTabLink>,
    );

    expect(screen.getByRole('link')).toHaveAccessibleName('Profil GitHub (nouvel onglet)');
  });

  it('gives the new tab no access to the site, nor its address', () => {
    render(<NewTabLink href={URL}>GitHub</NewTabLink>);

    const relValues = screen.getByRole('link').getAttribute('rel').split(' ');
    expect(relValues).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
  });

  it('keeps opening a new tab, without access to the site, whatever target and rel it gets', () => {
    render(
      <NewTabLink
        href={URL}
        target="_self"
        rel="opener"
      >
        GitHub
      </NewTabLink>,
    );

    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('passes the other attributes of a link, such as the class of styled(NewTabLink)', () => {
    render(
      <NewTabLink
        href={URL}
        className="profile"
        download="cv.pdf"
      >
        GitHub
      </NewTabLink>,
    );

    expect(screen.getByRole('link')).toHaveClass('profile');
    expect(screen.getByRole('link')).toHaveAttribute('download', 'cv.pdf');
  });

  it('calls its click handler', async () => {
    const onClick = vi.fn(event => event.preventDefault());
    render(
      <NewTabLink
        href={URL}
        onClick={onClick}
      >
        GitHub
      </NewTabLink>,
    );

    await userEvent.click(screen.getByRole('link'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
