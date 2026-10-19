import { useTranslation } from 'react-i18next';

import StatusPage from '../../components/StatusPage/index.ts';

/** Props of {@link Forbidden}. Both default to the translated forbidden texts. */
interface ForbiddenProps {
  /** Heading override. Defaults to the translated "Access denied". */
  title?: string;
  /**
   * Explanation override, e.g. to say who can access the page.
   * Defaults to a translated message.
   */
  message?: string;
}

/**
 * Page shown when the visitor may not access the requested content: a `403` code, a message
 * and a link back to the home page. The URL stays as typed, with no redirect.
 * No route uses it yet: render it from a route or a guard when access is denied.
 * Must be rendered inside a router.
 *
 * @example
 * <Route path="/admin" element={isAdmin ? <Admin /> : <Forbidden />} />
 */
export const Forbidden = ({ title, message }: ForbiddenProps) => {
  const { t } = useTranslation();

  return (
    <StatusPage
      code={403}
      title={title ?? t('errors.forbidden.title')}
      message={message ?? t('errors.forbidden.message')}
      homeLinkLabel={t('errors.backHome')}
    />
  );
};
