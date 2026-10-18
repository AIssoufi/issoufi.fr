import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import styled from '@xstyled/styled-components';

import List from './List';

const getList = () => screen.getByRole('list');

describe('List', () => {
  it('renders a ul with an explicit list role, which Safari drops from lists without bullets', () => {
    render(
      <List>
        <li>React</li>
        <li>TypeScript</li>
      </List>,
    );
    const list = getList();

    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('role', 'list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders without any props', () => {
    render(<List />);
    const list = getList();

    expect(list).toHaveAttribute('role', 'list');
    expect(list).toBeEmptyDOMElement();
  });

  it('passes the attributes of a ul to the element', () => {
    render(
      <List
        id="skills"
        className="custom-list"
        aria-label="Compétences"
      />,
    );
    const list = screen.getByRole('list', { name: 'Compétences' });

    expect(list).toHaveAttribute('id', 'skills');
    expect(list).toHaveClass('custom-list');
  });

  it('gives its ref the ul element', () => {
    const ref = createRef();
    render(<List ref={ref} />);

    expect(ref.current).toBe(getList());
  });

  it.each(['presentation', 'menu', '', undefined, null])(
    'keeps the list role when given role %j',
    role => {
      render(<List role={role} />);
      expect(getList()).toHaveAttribute('role', 'list');
    },
  );

  it('keeps its role once extended with styled(), without passing transient props to the DOM', () => {
    const GridList = styled(List)`
      display: ${props => (props.$isGrid ? 'grid' : 'flex')};
    `;
    render(<GridList $isGrid />);
    const list = getList();

    expect(list).toHaveAttribute('role', 'list');
    expect(getComputedStyle(list).display).toBe('grid');
    expect(list).not.toHaveAttribute('$isGrid');
  });
});
