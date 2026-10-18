import { render, screen } from '@testing-library/react';

import i18n from '../../i18n';
import { isPublicFile } from '../testUtils';
import { BACKGROUND_IMAGE_URL } from './constants';
import { Experiences } from './Experiences';

describe('Experiences', () => {
  it('renders the page title', () => {
    render(<Experiences />);

    expect(screen.getByRole('heading', { name: 'Expériences', level: 1 })).toBeInTheDocument();
  });

  it('has a single main landmark and a single level 1 heading', () => {
    render(<Experiences />);

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('gives every list, bullet lists included, an explicit list role, which Safari drops from lists without bullets', () => {
    render(<Experiences />);
    // b3 has no non-breaking space, so its translated text matches the text of the page exactly
    const bulletList = screen.getByText(i18n.t('exp.wibilong.b3')).closest('ul');
    const lists = screen.getAllByRole('list', { hidden: true });

    expect(lists).toContain(bulletList);
    lists.forEach(list => expect(list).toHaveAttribute('role', 'list'));
  });

  it.each(['Sewan Groupe', 'Wibilong', 'Supralog', 'Beepeers'])('shows the %s experience', name => {
    render(<Experiences />);

    expect(screen.getAllByRole('img', { name }).length).toBeGreaterThan(0);
  });

  it('names the pseudo-element of its timeline line for the browser test of the timeline', () => {
    const { container } = render(<Experiences />);

    expect(container.querySelectorAll('[data-timeline-line="before"]')).toHaveLength(1);
  });

  it.each(['Sewan Groupe', 'Wibilong', 'Supralog', 'Beepeers'])(
    'names the pseudo-element of the dot of the %s experience for the browser test of the timeline',
    name => {
      render(<Experiences />);

      const [logo] = screen.getAllByRole('img', { name });
      expect(logo.closest('[data-timeline-dot="before"]')).not.toBeNull();
    },
  );

  it('serves its background from public/', () => {
    expect(isPublicFile(BACKGROUND_IMAGE_URL)).toBe(true);
  });
});
