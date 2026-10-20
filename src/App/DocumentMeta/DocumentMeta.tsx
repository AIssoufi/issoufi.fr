import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import { getYearsOfExperience } from '../../utils/career.ts';
import { getPage } from '../../utils/pages.ts';
import { getWebManifestUrl } from '../../utils/webManifest.ts';

/**
 * Keeps `<html lang>`, the document title, the meta description and the link to the web app
 * manifest in line with the current route and language. Renders nothing; must be placed inside
 * the router.
 *
 * @remarks
 * Unknown routes get the "page not found" title and description, matching the NotFound page
 * shown by the catch-all route. The years of experience are computed at runtime,
 * so they stay current between builds. Once the language toggle moves to the other language, the
 * page links the manifest of that language, so it installs as the site in that language, as after
 * a reload; a page without that link, as in the standalone build, gets none. The Open Graph and
 * Twitter tags and the structured data (JSON-LD) are left untouched: link preview crawlers and
 * search engines read them in the static HTML generated at build time for each URL.
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
    document
      .querySelector('link[rel="manifest"]')
      ?.setAttribute('href', getWebManifestUrl(i18n.language));
  }, [i18n.language, meta, t]);

  return null;
};

export default DocumentMeta;
