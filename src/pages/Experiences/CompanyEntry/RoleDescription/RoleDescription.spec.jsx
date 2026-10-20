import { render, screen, within } from '@testing-library/react';

import RoleDescription from './RoleDescription.tsx';

/**
 * A role with every part: introduction, bullet points, a project and technologies. It borrows
 * texts from several roles of the data, since no single one has every part.
 */
const ROLE = {
  titleKey: 'exp.sewanUiKit.title',
  intro: [
    { key: 'exp.sewanUiKit.intro1' },
    { key: 'exp.sewanUiKit.introStrong', isStrong: true },
    { key: 'exp.sewanUiKit.intro2' },
  ],
  bulletKeys: ['exp.sewanUiKit.b1', 'exp.sewanUiKit.b2'],
  projects: [
    {
      titleKey: 'exp.supralogClaris.proj1Title',
      stateKey: 'exp.supralogClaris.proj1State',
      description: [{ key: 'exp.supralogClaris.proj1Desc1' }],
      bulletKeys: ['exp.sewanUiKit.proj1B2'],
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

    expect(container).toHaveTextContent(/^Responsable de l’UI Kit interne de l’équipe Core Front/);
    expect(container.querySelector('strong')).toHaveTextContent(
      /^118 packages React et TypeScript$/,
    );
  });

  it('lists the bullet points of the role, then shows its project', () => {
    render(<RoleDescription role={ROLE} />);

    const [roleBullets, projectBullets] = screen.getAllByRole('list');
    expect(within(roleBullets).getAllByRole('listitem')).toHaveLength(2);
    expect(within(projectBullets).getByRole('listitem')).toHaveTextContent(
      'npm vers pnpm, Node 16 vers 22, Jest vers Vitest, Webpack vers tsup et Vite, Lerna 4 vers 8',
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

    expect(screen.getByText('CLARIS : refonte du SI de certification')).toBeInTheDocument();
    expect(screen.getByText('3 sprints livrés')).toBeInTheDocument();
    expect(screen.getByText(/^Au sein d’une équipe de sept développeurs/)).toBeInTheDocument();
    expect(screen.getByText('Vitest')).toBeInTheDocument();
  });

  it('shows a project without status badge when it has none', () => {
    render(
      <RoleDescription
        role={{ projects: [{ titleKey: 'exp.sewanUiKit.proj1Title', stateKey: 'exp.unknown' }] }}
      />,
    );

    expect(
      screen.getByText('Refonte de l’outillage, sans rupture pour les équipes consommatrices'),
    ).toBeInTheDocument();
    expect(screen.queryByText('exp.unknown')).not.toBeInTheDocument();
  });

  it('shows every project of the role, in order', () => {
    render(
      <RoleDescription
        role={{
          projects: [
            { titleKey: 'exp.sewanUiKit.proj1Title' },
            { titleKey: 'exp.supralogFfbad.proj1Title' },
          ],
        }}
      />,
    );

    expect(
      screen.getByText('Refonte de l’outillage, sans rupture pour les équipes consommatrices'),
    ).toBeInTheDocument();
    expect(screen.getByText('MyFFBaD : espace licencié de la FFBaD')).toBeInTheDocument();
  });
});
