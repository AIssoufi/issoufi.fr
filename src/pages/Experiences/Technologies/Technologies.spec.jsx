import { render, screen, within } from '@testing-library/react';

import { theme } from '../../../theme/index.ts';
import Technologies from './Technologies.tsx';

describe('Technologies', () => {
  it('renders nothing without any props', () => {
    const { container } = render(<Technologies />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an empty list', () => {
    const { container } = render(<Technologies technologies={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the line height of its chips wherever it stands', () => {
    render(<Technologies technologies={['React.js']} />);

    expect(getComputedStyle(screen.getByRole('list')).lineHeight).toBe(
      String(theme.lineHeights[160]),
    );
  });

  it.each([
    ['a name written without its brackets', 'React.js'],
    ['an object', { name: 'React.js' }],
    ['null', null],
    ['a list without any name', ['', 42]],
  ])('renders nothing for %s, without crashing', (_case, technologies) => {
    const { container } = render(<Technologies technologies={technologies} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows each name once, leaving out the entries that are not names', () => {
    render(<Technologies technologies={['React.js', 42, 'Vite', 'React.js']} />);

    expect(screen.getAllByRole('listitem').map(({ textContent }) => textContent)).toEqual([
      'React.js',
      'Vite',
    ]);
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
