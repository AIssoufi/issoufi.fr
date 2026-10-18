import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useUrlLanguage } from '../../hooks/useUrlLanguage';

/**
 * Keeps the i18next language in line with the language of the current URL (see
 * `useUrlLanguage`): the URL names the language, and the texts follow it after a navigation,
 * including the browser's back and forward buttons. The language changes before the browser
 * paints, so a page never shows in the language of the previous URL. Renders nothing; must be
 * placed inside the router.
 */
const UrlLanguage = () => {
  const urlLanguage = useUrlLanguage();
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  useLayoutEffect(() => {
    if (currentLanguage !== urlLanguage) i18n.changeLanguage(urlLanguage);
  }, [currentLanguage, i18n, urlLanguage]);

  return null;
};

export default UrlLanguage;
