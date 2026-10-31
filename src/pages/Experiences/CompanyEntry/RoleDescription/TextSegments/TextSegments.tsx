import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { translateKey } from '../../../../../i18n/utils.ts';

/**
 * One piece of a paragraph of `.data/experiences.json`: a text named by its translation key,
 * which the page writes after the previous piece, in bold when `isStrong` is true.
 */
export interface TextSegmentData {
  /** Translation key of the text, e.g. `exp.sewanUiKit.intro1`. */
  key?: string;
  /** Whether the text is in bold, as a company or a client name. @default false */
  isStrong?: boolean;
}

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
 *     { key: 'exp.sewanFoundation.intro1' },
 *     { key: 'exp.sewanFoundation.introStrong', isStrong: true },
 *     { key: 'exp.sewanFoundation.intro2' },
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
