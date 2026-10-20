import { render, screen, within } from '@testing-library/react';

import { MIN_FONT_SIZE_PX } from '../../../theme/constants.ts';
import Project from './Project.tsx';

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

    expect(screen.getByRole('heading', { level: 4, name: 'MyFFBaD' })).toBeInTheDocument();
    expect(screen.getByText('Livré dans les délais')).toBeInTheDocument();
    expect(screen.getByText('Espace licencié de la FFBaD')).toBeInTheDocument();
    expect(screen.getByText('React.js')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
  });

  it('shows its state badge at the smallest font size of the site', () => {
    render(<Project state="En production" />);

    expect(getComputedStyle(screen.getByText('En production')).fontSize).toBe(
      `${MIN_FONT_SIZE_PX}px`,
    );
  });

  it('shows no toggle arrow, since the description is always shown', () => {
    render(<Project title="MyFFBaD">Espace licencié de la FFBaD</Project>);

    expect(screen.queryByText('▾')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Espace licencié de la FFBaD')).toBeVisible();
  });

  it.each([
    ['a title only', { title: 'MyFFBaD' }, 'MyFFBaD'],
    ['a state only', { state: 'En production' }, 'En production'],
  ])('renders the header with %s', (_, props, headerText) => {
    const { container } = render(<Project {...props} />);
    const header = container.querySelector('header');

    expect(header).toBeInTheDocument();
    expect(within(header).getByText(headerText)).toBeInTheDocument();
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
