import type { ComponentPropsWithRef } from 'react';
import { useTranslation } from 'react-i18next';

import { isNonBlankString } from '../../utils/strings';
import VisuallyHidden from '../VisuallyHidden';

/**
 * Props of {@link NewTabLink}: those of an `a`, but its `target` and `rel`, which it sets, and its
 * `aria-label` and `aria-labelledby`, which would replace the notice in the name of the link.
 * `children` is the content that names the link, such as a text, or an icon hidden from screen
 * readers next to a `VisuallyHidden` text. `href` is the page to open: without one, or with a
 * blank one, there is no link, and only `children` is rendered.
 */
type NewTabLinkProps = Omit<
  ComponentPropsWithRef<'a'>,
  'target' | 'rel' | 'aria-label' | 'aria-labelledby'
>;

/**
 * Link that opens its page in a new tab, which gets no access to the site (no `window.opener`)
 * nor its address as the referrer. After its content, screen readers read a translated notice
 * that only they get, "(nouvel onglet)" or "(opens in a new tab)", so that the new tab never
 * comes as a surprise. Without a `href`, it renders its content alone, with neither a link nor the
 * notice, which would then be read on its own. Every link of the site that opens a new tab is
 * one, extended with `styled(NewTabLink)` when it has styles (ESLint refuses `target="_blank"`
 * anywhere else).
 *
 * @example
 * <NewTabLink href="https://github.com/AIssoufi">GitHub</NewTabLink>
 * // Read as "GitHub (nouvel onglet)" on a French page
 */
const NewTabLink = ({ href, children, ...props }: NewTabLinkProps) => {
  const { t } = useTranslation();
  if (!isNonBlankString(href)) return <>{children}</>;

  return (
    <a
      {...props}
      href={href}
      // eslint-disable-next-line no-restricted-syntax -- the one element that opens a new tab
      target="_blank"
      rel="noopener noreferrer"
    >
      {children} <VisuallyHidden>{t('newTabLink.notice')}</VisuallyHidden>
    </a>
  );
};

export default NewTabLink;
