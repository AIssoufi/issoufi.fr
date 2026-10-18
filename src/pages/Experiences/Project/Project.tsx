import Technologies from '../Technologies';

import { Body, Container, Description, Header, State, Title } from './Project.styled';

/** Props of {@link Project}. Every part is optional and is not rendered when missing. */
interface ProjectProps {
  /** Project name, already translated, a `h4` under the `h3` of its job. */
  title?: string;
  /** Short status badge, e.g. "En production" or "Livré dans les délais". */
  state?: string;
  /** Technologies used, listed under the description. @default [] */
  technologies?: string[];
  /** Description of the project: text or bullet lists. */
  children?: React.ReactNode;
}

const NO_TECHNOLOGIES: string[] = [];

/**
 * Block describing one project carried out within a job: title, status badge, description and
 * technologies. Used inside `Experience` and `ExperienceGroup.Role`, also exposed as
 * `Experience.Project` and `ExperienceGroup.Role.Project`. The header is left out when there is
 * neither a title nor a status badge, so no empty padded row is shown.
 *
 * @example
 * <Project title="MyFFBaD" state="Livré dans les délais" technologies={['React.js', 'NestJS']}>
 *   Development of the licensee portal.
 * </Project>
 */
const Project = ({ title, state, technologies = NO_TECHNOLOGIES, children }: ProjectProps) => {
  const hasHeader = Boolean(title) || Boolean(state);

  return (
    <Container>
      {hasHeader && (
        <Header>
          {title && <Title>{title}</Title>}
          {state && <State>{state}</State>}
        </Header>
      )}
      <Body>
        <Description>{children}</Description>
        {technologies.length > 0 && <Technologies technologies={technologies} />}
      </Body>
    </Container>
  );
};

export default Project;
