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
});
