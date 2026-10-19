import { render, screen, within } from '@testing-library/react';

import { theme } from '../../../theme';
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

  it('gives its list the class of a parent that places it', () => {
    render(
      <Technologies
        className="placed"
        technologies={['React.js']}
      />,
    );

    expect(screen.getByRole('list')).toHaveClass('placed');
  });

  it('keeps the line height of its chips wherever it stands', () => {
    render(<Technologies technologies={['React.js']} />);

    expect(getComputedStyle(screen.getByRole('list')).lineHeight).toBe(
      String(theme.lineHeights[160]),
    );
  });

  it('renders one chip per technology', () => {
    render(<Technologies technologies={['React.js', 'TypeScript']} />);

    expect(screen.getByText('React.js')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('lists the chips in order, in a list with an explicit role, which Safari drops from lists without bullets', () => {
    render(<Technologies technologies={['React.js', 'TypeScript', 'Vite']} />);
    const list = screen.getByRole('list');

    expect(list).toHaveAttribute('role', 'list');
    expect(
      within(list)
        .getAllByRole('listitem')
        .map(({ textContent }) => textContent),
    ).toEqual(['React.js', 'TypeScript', 'Vite']);
  });
});
