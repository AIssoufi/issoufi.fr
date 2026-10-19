import type { ComponentPropsWithRef } from 'react';
import { Link } from 'react-router';

import { localizePath } from '../../i18n/utils';
import { useUrlLanguage } from '../../hooks/useUrlLanguage';

/** Props of {@link LocalizedLink}: those of the router `Link`, with a path as `to`. */
type LocalizedLinkProps = Omit<ComponentPropsWithRef<typeof Link>, 'to'> & {
  /**
   * Path of the page in the default language, e.g. `/projects`. A path with a language prefix is
   * moved to the language of the current URL too.
   * @default '/'
   */
  to?: string;
};

/**
 * Router link to a page of the site in the language of the current URL: `to="/projects"` leads to
 * `/projects` on a French page and to `/en/projects` on an English one (see `localizePath`), so a
 * visitor stays in the language they browse in. Every internal link uses it, extended with
 * `styled(LocalizedLink)` when it has styles. Must be rendered inside a router.
 *
 * @example
 * <LocalizedLink to="/">Home</LocalizedLink>
 */
const LocalizedLink = ({ to, ...props }: LocalizedLinkProps) => {
  const language = useUrlLanguage();

  return (
    <Link
      {...props}
      to={localizePath({ path: to, language })}
    />
  );
};

export default LocalizedLink;
