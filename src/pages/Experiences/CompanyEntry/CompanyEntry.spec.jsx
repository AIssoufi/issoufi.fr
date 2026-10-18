import { act, render, screen } from '@testing-library/react';

import i18n from '../../../i18n';
import CompanyEntry from './CompanyEntry';

/** A company with a single role, shown as one card after its period. */
const WIBILONG = {
  id: 'wibilong',
  nameKey: 'exp.wibilong.name',
  contractKey: 'exp.wibilong.contract',
  cityKey: 'exp.wibilong.city',
  logoUrl: '/wibilong.png',
  periodStartKey: 'exp.periods.wibilongStart',
  periodEndKey: 'exp.periods.wibilongEnd',
  roles: [
    {
      titleKey: 'exp.wibilong.title',
      startKey: 'exp.wibilong.start',
      endKey: 'exp.wibilong.end',
      bulletKeys: ['exp.wibilong.b3'],
    },
  ],
};

/** A company with two roles, shown as a group that writes the company once. */
const SEWAN = {
  id: 'sewan',
  nameKey: 'exp.sewan.name',
  contractKey: 'exp.sewan.contract',
  cityKey: 'exp.sewan.city',
  logoUrl: '/sewan.png',
  roles: [
    {
      titleKey: 'exp.sewanLead.title',
      startKey: 'exp.sewanLead.start',
      endKey: 'exp.sewanLead.end',
    },
    {
      titleKey: 'exp.sewanSenior.title',
      startKey: 'exp.sewanSenior.start',
      endKey: 'exp.sewanSenior.end',
    },
  ],
};

describe('CompanyEntry', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders without any props', () => {
    expect(() => render(<CompanyEntry />)).not.toThrow();
  });

  it('renders a company without roles', () => {
    render(<CompanyEntry experience={{ ...WIBILONG, roles: [] }} />);

    expect(screen.getByRole('img', { name: 'Wibilong' })).toBeInTheDocument();
  });

  describe('with a single role', () => {
    it('shows the company, the job and its description', () => {
      render(<CompanyEntry experience={WIBILONG} />);

      expect(screen.getByRole('img', { name: 'Wibilong' })).toHaveAttribute('src', '/wibilong.png');
      expect(
        screen.getByText('Full-Stack JavaScript Engineer — React, Node.js, AWS'),
      ).toBeVisible();
      expect(screen.getByText('Wibilong · CDI · Paris (75)')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Maintien en condition opérationnelle (MCO) et résolution de bugs en production',
        ),
      ).toBeInTheDocument();
    });

    it('writes the period of the company on the timeline', () => {
      const { container } = render(<CompanyEntry experience={WIBILONG} />);

      expect(container).toHaveTextContent('sept. 2019');
      expect(container).toHaveTextContent('juin 2021');
    });

    it('names the pseudo-element of its dot for the browser test of the timeline', () => {
      const { container } = render(<CompanyEntry experience={WIBILONG} />);

      expect(container.firstChild).toHaveAttribute('data-timeline-dot', 'before');
    });

    it('writes its texts in the active language', async () => {
      render(<CompanyEntry experience={WIBILONG} />);

      await act(() => i18n.changeLanguage('en'));

      expect(screen.getByText('Wibilong · Permanent · Paris (75)')).toBeInTheDocument();
    });
  });

  describe('with several roles', () => {
    it('shows each job, in order', () => {
      render(<CompanyEntry experience={SEWAN} />);

      const jobs = screen.getAllByText(/Engineer/).map(node => node.textContent);
      expect(jobs).toEqual([
        'Lead Frontend Engineer — UI Kit Owner & Architect',
        'Senior Full-Stack Engineer — Core Platform (React, Node.js, GraphQL)',
      ]);
    });

    it('writes the company with each job', () => {
      render(<CompanyEntry experience={SEWAN} />);

      expect(screen.getAllByRole('img', { name: 'Sewan Groupe' })).toHaveLength(2);
    });

    it('names the pseudo-element of the dot of the group for the browser test of the timeline', () => {
      const { container } = render(<CompanyEntry experience={SEWAN} />);

      expect(container.firstChild).toHaveAttribute('data-timeline-dot', 'before');
    });
  });
});
