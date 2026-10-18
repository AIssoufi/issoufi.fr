import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import { isPublicFile } from '../../pages/testUtils';
import { declaredStyle } from '../../styleTestUtils';
import { BACKGROUND_IMAGE_URL } from './constants';
import StatusPage from './StatusPage';

const getMain = () => screen.getByRole('main');

/** Value declared for a property of the main landmark, or of one of its pseudo-elements. */
const mainStyle = ({ property, pseudo }) => declaredStyle({ element: getMain(), property, pseudo });

describe('StatusPage', () => {
  it('renders the status message in the main landmark of the page', () => {
    render(
      <MemoryRouter>
        <StatusPage
          code={404}
          title="Page introuvable"
          message="La page /skills n’existe pas."
          homeLinkLabel="Retour à l’accueil"
        />
      </MemoryRouter>,
    );

    const main = getMain();
    expect(main).toContainElement(screen.getByText('404'));
    expect(main).toContainElement(screen.getByRole('heading', { name: 'Page introuvable' }));
    expect(main).toContainElement(screen.getByText('La page /skills n’existe pas.'));
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
  });

  it('passes the action on to its message', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <StatusPage
        actionLabel="Recharger la page"
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Recharger la page' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows the photo of the status pages behind the page', () => {
    render(<StatusPage title="Page introuvable" />);

    expect(mainStyle({ property: 'background-image', pseudo: '::before' })).toBe(
      `url("${BACKGROUND_IMAGE_URL}")`,
    );
  });

  it('serves its background from public/', () => {
    expect(isPublicFile(BACKGROUND_IMAGE_URL)).toBe(true);
  });

  it('centers the message in the height of the page', () => {
    render(<StatusPage title="Page introuvable" />);

    expect(mainStyle({ property: 'display' })).toBe('flex');
    expect(mainStyle({ property: 'flex-direction' })).toBe('column');
    expect(mainStyle({ property: 'justify-content' })).toBe('center');
  });

  it('keeps as much room under the message as above it', () => {
    render(<StatusPage title="Page introuvable" />);

    expect(mainStyle({ property: 'padding-bottom' })).toBe(mainStyle({ property: 'padding-top' }));
    expect(mainStyle({ property: 'padding-bottom' })).not.toBe('0px');
  });

  it('renders a single main landmark without any props or router', () => {
    expect(() => render(<StatusPage />)).not.toThrow();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
