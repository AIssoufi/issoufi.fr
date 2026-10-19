import { render, screen, within } from '@testing-library/react';

import RoleDescription from './RoleDescription';

/** A role with every part: introduction, bullet points, a project and technologies. */
const ROLE = {
  titleKey: 'exp.sewanLead.title',
  intro: [
    { key: 'exp.sewanLead.intro1' },
    { key: 'exp.sewanLead.introStrong', isStrong: true },
    { key: 'exp.sewanLead.intro2' },
  ],
  bulletKeys: ['exp.sewanLead.b1', 'exp.sewanLead.b2'],
  projects: [
    {
      titleKey: 'exp.sewanLead.proj1Title',
      stateKey: 'exp.sewanLead.proj1State',
      description: [{ key: 'exp.sewanLead.proj1Intro' }],
      bulletKeys: ['exp.sewanLead.proj1B4'],
      technologies: ['Vitest'],
    },
  ],
  technologies: ['React.js', 'TypeScript'],
};

describe('RoleDescription', () => {
  it('renders nothing without any props', () => {
    const { container } = render(<RoleDescription />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an empty role', () => {
    const { container } = render(<RoleDescription role={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('writes the introduction, with its strong piece in bold', () => {
    const { container } = render(<RoleDescription role={ROLE} />);

    expect(container).toHaveTextContent(/^Owner et référent technique de l’UI Kit interne Sewan/);
    expect(container.querySelector('strong')).toHaveTextContent(/^~15 équipes produit$/);
  });

  it('lists the bullet points of the role, then shows its project', () => {
    render(<RoleDescription role={ROLE} />);

    const [roleBullets, projectBullets] = screen.getAllByRole('list');
    expect(within(roleBullets).getAllByRole('listitem')).toHaveLength(2);
    expect(within(projectBullets).getByRole('listitem')).toHaveTextContent(
      'Refonte intégrale du pipeline CI/CD GitLab',
    );
  });

  it('leaves the technologies of the role to its card, which shows them apart', () => {
    render(<RoleDescription role={ROLE} />);

    expect(screen.queryByText('React.js')).not.toBeInTheDocument();
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
    // The technologies of its projects stay with them
    expect(screen.getByText('Vitest')).toBeInTheDocument();
  });

  it('shows the title, the status, the description and the technologies of each project', () => {
    render(<RoleDescription role={ROLE} />);

    expect(screen.getByText('Modernisation complète de la stack technique')).toBeInTheDocument();
    expect(screen.getByText('En production')).toBeInTheDocument();
    expect(screen.getByText(/^Refonte technique de bout en bout/)).toBeInTheDocument();
    expect(screen.getByText('Vitest')).toBeInTheDocument();
  });

  it('shows a project without status badge when it has none', () => {
    render(
      <RoleDescription
        role={{ projects: [{ titleKey: 'exp.sewanSenior.proj1Title', stateKey: 'exp.unknown' }] }}
      />,
    );

    expect(screen.getByText('friday — BFF GraphQL')).toBeInTheDocument();
    expect(screen.queryByText('exp.unknown')).not.toBeInTheDocument();
  });

  it('shows every project of the role, in order', () => {
    render(
      <RoleDescription
        role={{
          projects: [
            { titleKey: 'exp.sewanSenior.proj1Title' },
            { titleKey: 'exp.sewanSenior.proj2Title' },
          ],
        }}
      />,
    );

    expect(screen.getByText('friday — BFF GraphQL')).toBeInTheDocument();
    expect(screen.getByText('onboarding-app — Espace client React')).toBeInTheDocument();
  });
});
