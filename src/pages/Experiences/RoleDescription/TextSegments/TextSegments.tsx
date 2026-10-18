import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { translateKey } from '../../../../i18n/utils';
import type { TextSegmentData } from '../../types';

/** Props of {@link TextSegments}. */
interface TextSegmentsProps {
  /** Pieces of the paragraph, in order. Nothing is rendered when it is missing or empty. */
  segments?: TextSegmentData[];
}

const NO_SEGMENTS: TextSegmentData[] = [];

/**
 * Writes a paragraph of `.data/experiences.json` in the active language, piece after piece,
 * without a wrapping element: the strong pieces, such as a client name, in a `<strong>`, the
 * others as plain text. A piece whose key has no translation is left out.
 *
 * @example
 * <TextSegments
 *   segments={[
 *     { key: 'exp.sewanSenior.intro1' },
 *     { key: 'exp.sewanSenior.introStrong', isStrong: true },
 *     { key: 'exp.sewanSenior.intro2' },
 *   ]}
 * />
 */
const TextSegments = ({ segments = NO_SEGMENTS }: TextSegmentsProps) => {
  const { t } = useTranslation();

  return segments.map(({ key, isStrong = false }, index) => {
    const text = translateKey({ t, key });
    if (!text) return null;

    // The pieces of a paragraph never move, so their position is a stable key
    return isStrong ? <strong key={index}>{text}</strong> : <Fragment key={index}>{text}</Fragment>;
  });
};

export default TextSegments;
