import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { MAIN_CONTENT_ID } from '../../constants/landmarks';
import { focusPageHeading } from '../utils';

import { Link } from './SkipLink.styled';

/**
 * Link to the content of the page, "Aller au contenu" ("Skip to content" in English), the first
 * element that `Tab` reaches, so that keyboard users skip the links of the header. Hidden until it
 * has the focus, it then shows over the top left corner of the header. Following it moves the
 * focus to the heading of the page (see {@link focusPageHeading}), from which the next `Tab`
 * reaches the content, without adding the fragment of its `href`, the `<main>` of the page, to the
 * URL. Render it first in the document.
 */
const SkipLink = () => {
  const { t } = useTranslation();

  const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    focusPageHeading();
  };

  return (
    <Link
      href={`#${MAIN_CONTENT_ID}`}
      onClick={skipToContent}
    >
      {t('skipLink.text')}
    </Link>
  );
};

export default SkipLink;
