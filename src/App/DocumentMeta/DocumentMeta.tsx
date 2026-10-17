import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { getYearsOfExperience } from '../../utils/career';
import { getPage } from '../../utils/pages';

// Keeps the lang attribute, the title and the meta description in line with the page and the language
const DocumentMeta = () => {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const { meta } = getPage(pathname);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.title = t(`meta.${meta}.title`);
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t(`meta.${meta}.description`, { years: getYearsOfExperience() }));
  }, [i18n.language, meta, t]);

  return null;
};

export default DocumentMeta;
