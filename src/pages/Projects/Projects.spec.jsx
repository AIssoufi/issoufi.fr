import { render, screen } from '@testing-library/react';

import { Projects } from './Projects';

describe('Projects', () => {
  it('renders the personal and freelance sections', () => {
    render(<Projects />);

    expect(screen.getByText('Projets personnels')).toBeInTheDocument();
    expect(screen.getByText('Projets freelance')).toBeInTheDocument();
  });
});
