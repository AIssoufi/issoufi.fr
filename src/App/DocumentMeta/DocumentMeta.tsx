import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import { getYearsOfExperience } from '../../utils/career';
import { getPage } from '../../utils/pages';

/**
 * Keeps `<html lang>`, the document title and the meta description in line with the current
 * route and language. Renders nothing; must be placed inside the router.
 *
 * @remarks
 * Unknown routes get the "page not found" title and description, matching the NotFound page
 * shown by the catch-all route. The years of experience are computed at runtime,
 * so they stay current between builds. The Open Graph and Twitter tags are left untouched:
 * link preview crawlers only read the static HTML generated at build time.
 */
const DocumentMeta = () => {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const meta = getPage(pathname)?.meta ?? 'notFound';

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
