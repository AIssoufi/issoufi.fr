import { listUniqueNonBlankStrings } from '../../../utils/strings.ts';
import { TechChip, TechList } from './Technologies.styled.ts';

/** Props of {@link Technologies}. */
interface TechnologiesProps {
  /**
   * Technology names, in display order, each shown once. A value that is not an array, or an
   * entry that is not a name, is left out, as data written by mistake could hold.
   */
  technologies?: string[];
}

/**
 * Row of chips listing the technologies of a job or a project, a list that screen readers
 * announce with its number of items. Renders nothing when there is no name to show. A job card
 * renders the technologies of its job from its own `technologies` prop, and a `Project` those of
 * the project.
 *
 * @example
 * <Technologies technologies={['React.js', 'TypeScript']} />
 */
const Technologies = ({ technologies }: TechnologiesProps) => {
  const names = listUniqueNonBlankStrings(technologies);
  if (names.length === 0) return null;

  return (
    <TechList>
      {names.map(name => (
        <TechChip key={name}>{name}</TechChip>
      ))}
    </TechList>
  );
};

export default Technologies;
