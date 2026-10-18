import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import { DESKTOP_MEDIA_QUERY } from '../constants';
import NavMenu from './NavMenu';
import { declaredStyle } from '../../../styleTestUtils';

const items = [
  { name: 'Accueil', url: '/', end: true },
  { name: 'Projets', url: '/projects' },
];

const renderAt = (path, props) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <NavMenu {...props} />
    </MemoryRouter>,
  );

describe('NavMenu', () => {
  it('renders the CV link without any props', () => {
    renderAt('/');

    expect(screen.getByText('CV').closest('a')).toHaveAttribute('href', '/CV - Adam Issoufi.pdf');
  });

  it('renders the links and highlights the active one', () => {
    renderAt('/projects', { items });

    expect(screen.getByText('Projets').closest('a')).toHaveClass('active');
    expect(screen.getByText('Accueil').closest('a')).not.toHaveClass('active');
  });

  it('lists the links with an explicit list role, which Safari drops from lists without bullets', () => {
    renderAt('/', { items });
    const list = screen.getByRole('list', { hidden: true });

    expect(list).toHaveAttribute('role', 'list');
    expect(within(list).getAllByRole('listitem', { hidden: true })).toHaveLength(items.length);
  });

  it('keeps the list role without any items', () => {
    renderAt('/');
    const list = screen.getByRole('list', { hidden: true });

    expect(list).toHaveAttribute('role', 'list');
    expect(list).toBeEmptyDOMElement();
  });

  it('calls onClick when a link is clicked', async () => {
    const onClick = vi.fn();
    renderAt('/', { items, onClick });

    await userEvent.click(screen.getByText('Projets'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe('GitHub icon', () => {
    const getGitHubLink = () =>
      screen.getByRole('link', { name: 'Profil GitHub d’ADAM Issoufi', hidden: true });

    it('follows the CV button in the mobile menu', () => {
      renderAt('/', { items, mobileMenuIsOpen: true });

      const cvLink = screen.getByText('CV').closest('a');
      expect(cvLink.nextElementSibling).toBe(getGitHubLink());
      expect(getGitHubLink()).toBeVisible();
    });

    it('closes the mobile menu when it is clicked', async () => {
      const onClick = vi.fn(event => event?.preventDefault());
      renderAt('/', { items, onClick, mobileMenuIsOpen: true });

      await userEvent.click(getGitHubLink());

      expect(onClick).toHaveBeenCalledOnce();
    });

    it('is hidden on desktop, where the header shows it under the language toggle', () => {
      renderAt('/', { items });

      const display = declaredStyle({
        element: getGitHubLink(),
        property: 'display',
        media: DESKTOP_MEDIA_QUERY,
      });
      expect(display).toBe('none');
    });
  });

  it('gives the navigation its id, so a button can name it as the menu it controls', () => {
    renderAt('/', { id: 'mobile-menu' });

    expect(screen.getByRole('navigation', { hidden: true })).toHaveAttribute('id', 'mobile-menu');
  });

  it.each([
    ['without one', {}],
    ['when it is empty', { id: '' }],
  ])('gives the navigation no id %s', (_case, props) => {
    renderAt('/', props);

    expect(screen.getByRole('navigation', { hidden: true })).not.toHaveAttribute('id');
  });
});
