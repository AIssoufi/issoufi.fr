import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import StatusPage from '../../components/StatusPage/index.ts';
import { useIsHydrated } from '../../hooks/useIsHydrated/index.ts';
import { getNotFoundMessage } from './utils.ts';

/** Props of {@link NotFound}. Both default to the translated not found texts. */
interface NotFoundProps {
  /** Heading override, e.g. for a missing project. Defaults to the translated "Page not found". */
  title?: string;
  /**
   * Explanation override. Defaults to a translated message naming the current path
   * ({@link getNotFoundMessage}), or to one that names none in the page rendered at build time.
   */
  message?: string;
}

/**
 * Page shown when nothing exists at the current URL: a `404` code, a message naming the path,
 * decoded, with its invisible characters left encoded, cut when it is very long and wrapped at any
 * character when it is longer than the line, and a link back to the home page. The path never goes
 * through i18next, so i18next reads nothing in it. The URL stays as typed, with no redirect.
 * Rendered by the catch-all route of `App`; a page can also render it for a missing resource. Must
 * be rendered inside a router. The build renders it at a path of its own (`NOT_FOUND_PATH`), which
 * is not the one that the visitor typed: its message then names no path, and the browser renders
 * the page again with it (see {@link useIsHydrated}).
 *
 * @example
 * <NotFound message="This project does not exist." />
 */
export const NotFound = ({ title, message }: NotFoundProps) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const isHydrated = useIsHydrated();
  const defaultMessage = isHydrated
    ? getNotFoundMessage({ t, path: pathname })
    : t('errors.notFound.messageWithoutPath');

  return (
    <StatusPage
      code={404}
      title={title ?? t('errors.notFound.title')}
      message={message ?? defaultMessage}
      homeLinkLabel={t('errors.backHome')}
    />
  );
};
