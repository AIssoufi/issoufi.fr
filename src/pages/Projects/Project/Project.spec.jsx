import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Project from './Project';

const project = (id, name, extra = {}) => ({
  id,
  name,
  type: 'Application web',
  imageUrl: `/${id}.png`,
  tools: ['HTML 5', 'CSS 3'],
  likeCount: 0,
  isLikedByOwnUser: false,
  ...extra,
});

const projects = [
  project(1, 'Chess', { url: 'https://example.com/chess', likeCount: 2, isLikedByOwnUser: true }),
  project(2, 'Calculator'),
  project(3, 'Plugin store'),
  project(4, 'Connect Four'),
];

const likeButtonOf = name =>
  within(screen.getByRole('img', { name }).parentElement).getByRole('button');

describe('Project', () => {
  it('renders without any props', () => {
    expect(() => render(<Project />)).not.toThrow();
    expect(screen.getByText('Tout afficher (0)')).toBeInTheDocument();
  });

  it('shows the first three projects, then all of them on demand', async () => {
    render(
      <Project
        title="Projets personnels"
        projects={projects}
      />,
    );

    expect(screen.getByText('Projets personnels')).toBeInTheDocument();
    expect(screen.getByText('Chess')).toBeInTheDocument();
    expect(screen.queryByText('Connect Four')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Tout afficher (4)'));

    expect(screen.getByText('Connect Four')).toBeInTheDocument();
    expect(screen.getByText('Afficher moins')).toBeInTheDocument();
  });

  it('links a project to its url when it has one', () => {
    render(<Project projects={projects} />);

    expect(screen.getByText('Chess').closest('a')).toHaveAttribute(
      'href',
      'https://example.com/chess',
    );
    expect(screen.getByText('Calculator').closest('a')).toBeNull();
  });

  it('does not follow the card link when the like button is clicked', () => {
    render(<Project projects={projects} />);

    const isDefaultAllowed = fireEvent.click(likeButtonOf('Chess'));

    expect(isDefaultAllowed).toBe(false);
    expect(likeButtonOf('Chess')).toHaveTextContent('1');
  });

  it('toggles the like count', async () => {
    render(<Project projects={projects} />);

    await userEvent.click(likeButtonOf('Calculator'));
    expect(likeButtonOf('Calculator')).toHaveTextContent('1');

    await userEvent.click(likeButtonOf('Chess'));
    expect(likeButtonOf('Chess')).toHaveTextContent('1');
  });
});
