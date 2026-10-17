import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import StatusMessage from '../../components/StatusMessage';
import { NotFoundPage } from './NotFound.styled';

/** Props of {@link NotFound}. Both default to the translated not found texts. */
interface NotFoundProps {
  /** Heading override, e.g. for a missing project. Defaults to the translated "Page not found". */
  title?: string;
  /** Explanation override. Defaults to a translated message naming the current path. */
  message?: string;
}

/**
 * Page shown when nothing exists at the current URL: a `404` code, a message naming the path
 * and a link back to the home page. The URL stays as typed, with no redirect.
 * Rendered by the catch-all route of `App`; a page can also render it for a missing resource.
 * Must be rendered inside a router.
 *
 * @example
 * <NotFound message="This project does not exist." />
 */
export const NotFound = ({ title, message }: NotFoundProps) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <NotFoundPage>
      <StatusMessage
        code={404}
        title={title ?? t('errors.notFound.title')}
        message={message ?? t('errors.notFound.message', { path: pathname })}
        homeLinkLabel={t('errors.backHome')}
      />
    </NotFoundPage>
  );
};
