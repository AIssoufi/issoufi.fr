import { render, screen } from '@testing-library/react';

import VisuallyHidden from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders an empty span without any props', () => {
    const { container } = render(<VisuallyHidden />);

    expect(container.firstChild.tagName).toBe('SPAN');
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('keeps its text for screen readers', () => {
    render(<VisuallyHidden>to</VisuallyHidden>);

    expect(screen.getByText('to')).toBeInTheDocument();
  });

  it('takes the text out of the flow, in a clipped box of one pixel', () => {
    render(<VisuallyHidden>to</VisuallyHidden>);

    expect(screen.getByText('to')).toHaveStyle({
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
    });
  });

  it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])('renders a %s as a hidden heading', element => {
    const level = Number(element.slice(1));
    render(<VisuallyHidden as={element}>Sewan Groupe</VisuallyHidden>);

    const heading = screen.getByRole('heading', { level, name: 'Sewan Groupe' });
    expect(heading.tagName).toBe(element.toUpperCase());
    expect(heading).toHaveStyle({ position: 'absolute', margin: '0px' });
  });

  it.each(['div', 'script', 'H2', '', null, 2])('falls back to a span for the element %j', as => {
    render(<VisuallyHidden as={as}>to</VisuallyHidden>);

    expect(screen.getByText('to').tagName).toBe('SPAN');
  });
});
