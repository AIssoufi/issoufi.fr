import { act, render, screen, within } from '@testing-library/react';

import i18n from '../../../../../i18n/index.ts';
import { declaredStyle } from '../../../../../styleTestUtils.js';
import BulletPoints from './BulletPoints.tsx';

/** A `›` followed by its empty alternative text, the value of `content` after a slash. */
const ALTERNATIVE_TEXT_CONTENT = /^(['"])›\1\s*\/\s*(['"])\2$/;

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
      'Conception\u00a0: maquettes des écrans, architecture',
      'Maintenance des sites existants en AngularJS',
    ]);
  });

  it('draws a "›" before each point, with an empty alternative text, so that screen readers skip it', () => {
    render(<BulletPoints textKeys={['exp.beepeers.proj1B1']} />);
    const content = declaredStyle({
      element: screen.getByRole('listitem'),
      property: 'content',
      pseudo: '::before',
    });

    // Stylis drops the optional spaces around the slash
    expect(content).toMatch(ALTERNATIVE_TEXT_CONTENT);
  });

  it('keeps the "›" out of the text of the points', () => {
    render(<BulletPoints textKeys={['exp.beepeers.proj1B1']} />);

    expect(screen.getByRole('listitem').textContent).not.toContain('›');
  });

  it('writes the points in the active language', async () => {
    render(<BulletPoints textKeys={['exp.beepeers.proj1B1']} />);

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('listitem')).toHaveTextContent(
      /^Design: screen mockups, architecture$/,
    );
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
