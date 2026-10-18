import { render, screen } from '@testing-library/react';

import Project from './Project';

describe('Project', () => {
  it('renders without any props', () => {
    expect(() => render(<Project />)).not.toThrow();
  });

  it('renders the title, state, description and technologies', () => {
    render(
      <Project
        title="MyFFBaD"
        state="Livré dans les délais"
        technologies={['React.js', 'NestJS']}
      >
        Espace licencié de la FFBaD
      </Project>,
    );

    expect(screen.getByText('MyFFBaD')).toBeInTheDocument();
    expect(screen.getByText('Livré dans les délais')).toBeInTheDocument();
    expect(screen.getByText('Espace licencié de la FFBaD')).toBeInTheDocument();
    expect(screen.getByText('React.js')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
  });

  it('shows no toggle arrow, since the description is always shown', () => {
    render(<Project title="MyFFBaD">Espace licencié de la FFBaD</Project>);

    expect(screen.queryByText('▾')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Espace licencié de la FFBaD')).toBeVisible();
  });

  it.each([
    ['a title only', { title: 'MyFFBaD' }],
    ['a state only', { state: 'En production' }],
  ])('renders the header with %s', (_, props) => {
    const { container } = render(<Project {...props} />);

    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it.each([
    ['no title and no state', {}],
    ['an empty title and state', { title: '', state: '' }],
  ])('leaves out the header with %s', (_, props) => {
    const { container } = render(<Project {...props}>Espace licencié de la FFBaD</Project>);

    expect(container.querySelector('header')).not.toBeInTheDocument();
    expect(screen.getByText('Espace licencié de la FFBaD')).toBeInTheDocument();
  });
});
