import { TechChip, TechList } from './Technologies.styled';

/** Props of {@link Technologies}. */
interface TechnologiesProps {
  /** Technology names, in display order. Also used as React keys, so they must be unique. */
  technologies?: string[];
  /** Class of the list, for a parent that places it, such as `styled(Technologies)`. */
  className?: string;
}

/**
 * Row of chips listing the technologies of a job or a project, a list that screen readers
 * announce with its number of items. Renders nothing when the list is empty or missing. Also
 * exposed as `Experience.Technologies` and `ExperienceGroup.Role.Technologies`.
 *
 * @example
 * <Technologies technologies={['React.js', 'TypeScript']} />
 */
const Technologies = ({ technologies, className }: TechnologiesProps) => {
  if (!technologies?.length) return null;

  return (
    <TechList className={className}>
      {technologies.map(tech => (
        <TechChip key={tech}>{tech}</TechChip>
      ))}
    </TechList>
  );
};

export default Technologies;
