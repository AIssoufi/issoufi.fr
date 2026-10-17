import Technologies from '../Technologies';

import { Body, Container, Descriptiopn, Header, State, Title, Toggle } from './Project.styled';

interface ProjectProps {
  title: string;
  state?: string;
  technologies?: string[];
  children?: React.ReactNode;
}

const Project = ({ title, state, technologies = [], children }: ProjectProps) => (
  <Container>
    <Header>
      <Toggle>▾</Toggle>
      <Title>{title}</Title>
      {state && <State>{state}</State>}
    </Header>
    <Body>
      <Descriptiopn>{children}</Descriptiopn>
      {technologies.length > 0 && <Technologies technologies={technologies} />}
    </Body>
  </Container>
);

export default Project;
