import { useTranslation } from 'react-i18next';

import StatusPage from '../../../components/StatusPage/index.ts';

/** Reloads the page, which fetches its HTML and the chunks of the current deployment again. */
const reloadPage = () => window.location.reload();

/**
 * Page shown in place of a page that failed to render or to load: a translated message and a
 * button that reloads the page. Has no status code, since the server answered. Rendered by
 * `RouteErrorBoundary`; works without a router.
 */
const UnexpectedError = () => {
  const { t } = useTranslation();

  return (
    <StatusPage
      title={t('errors.unexpected.title')}
      message={t('errors.unexpected.message')}
      actionLabel={t('errors.unexpected.reload')}
      onAction={reloadPage}
    />
  );
};

export default UnexpectedError;
