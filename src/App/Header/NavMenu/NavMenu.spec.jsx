import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import NavMenu from './NavMenu';

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

  it('calls onClick when a link is clicked', async () => {
    const onClick = vi.fn();
    renderAt('/', { items, onClick });

    await userEvent.click(screen.getByText('Projets'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
