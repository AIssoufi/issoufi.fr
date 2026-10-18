import { useTranslation } from 'react-i18next';

import { translateKey } from '../../../../../i18n/utils';
import { BulletItem, BulletList } from './BulletPoints.styled';

/** Props of {@link BulletPoints}. */
interface BulletPointsProps {
  /** Translation keys of the bullet points, in order. Nothing is rendered when it is missing. */
  textKeys?: string[];
}

const NO_TEXT_KEYS: string[] = [];

/**
 * List of the bullet points of a role or a project, in the active language, each one after a
 * "›". A key without translation is left out, and the list too when none is left.
 *
 * @example
 * <BulletPoints textKeys={['exp.wibilong.b1', 'exp.wibilong.b2']} />
 */
const BulletPoints = ({ textKeys = NO_TEXT_KEYS }: BulletPointsProps) => {
  const { t } = useTranslation();
  const texts = textKeys.map(key => translateKey({ t, key })).filter(Boolean);
  if (texts.length === 0) return null;

  return (
    <BulletList>
      {texts.map((text, index) => (
        // The points of a role never move, so their position is a stable key
        <BulletItem key={index}>{text}</BulletItem>
      ))}
    </BulletList>
  );
};

export default BulletPoints;
