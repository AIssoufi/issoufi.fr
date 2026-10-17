import { TechChip, TechList } from './Technologies.styled';

interface TechnologiesProps {
  technologies: string[];
}

const Technologies = ({ technologies }: TechnologiesProps) => (
  <TechList>
    {technologies.map(tech => (
      <TechChip key={tech}>{tech}</TechChip>
    ))}
  </TechList>
);

export default Technologies;
