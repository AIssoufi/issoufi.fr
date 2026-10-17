import { render, screen } from '@testing-library/react';

import Technologies from './Technologies';

describe('Technologies', () => {
  it('renders nothing without any props', () => {
    const { container } = render(<Technologies />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an empty list', () => {
    const { container } = render(<Technologies technologies={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders one chip per technology', () => {
    render(<Technologies technologies={['React.js', 'TypeScript']} />);

    expect(screen.getByText('React.js')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });
});
