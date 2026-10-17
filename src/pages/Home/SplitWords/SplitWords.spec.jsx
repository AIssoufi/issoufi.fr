import { render } from '@testing-library/react';

import { SplitWords } from './SplitWords';

describe('SplitWords', () => {
  it('renders nothing without children', () => {
    const { container } = render(<SplitWords />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders one span per word', () => {
    const { container } = render(<SplitWords>Full-stack JavaScript Developer</SplitWords>);

    expect(container.querySelectorAll('span')).toHaveLength(3);
    expect(container).toHaveTextContent('Full-stack JavaScript Developer');
  });
});
