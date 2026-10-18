import { act, render, screen, within } from '@testing-library/react';

import i18n from '../../../../../i18n';
import BulletPoints from './BulletPoints';

describe('BulletPoints', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders nothing without any props', () => {
    const { container } = render(<BulletPoints />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an empty list', () => {
    const { container } = render(<BulletPoints textKeys={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the points in order, in a list with an explicit role, which Safari drops from lists without bullets', () => {
    render(<BulletPoints textKeys={['exp.beepeers.proj1B1', 'exp.beepeers.proj1B3']} />);

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('role', 'list');
    expect(
      within(list)
        .getAllByRole('listitem')
        .map(item => item.textContent),
    ).toEqual([
      'Architecture et maquettes des écrans',
      'Maintenance des sites existants en AngularJS',
    ]);
  });

  it('writes the points in the active language', async () => {
    render(<BulletPoints textKeys={['exp.beepeers.proj1B1']} />);

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('listitem')).toHaveTextContent(/^Screen architecture and mockups$/);
  });

  it('leaves out a key without translation, and keeps the other points', () => {
    render(<BulletPoints textKeys={['exp.unknown', 'exp.beepeers.proj1B1', 'exp.beepeers']} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('renders nothing when no key has a translation', () => {
    const { container } = render(<BulletPoints textKeys={['exp.unknown', '']} />);
    expect(container).toBeEmptyDOMElement();
  });
});
