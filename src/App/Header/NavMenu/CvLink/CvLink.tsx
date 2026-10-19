import { useTranslation } from 'react-i18next';

import { Icon, Link } from './CvLink.styled';
import { getCvUrl } from './utils';

/** Props of {@link CvLink}. Every prop is optional. */
interface CvLinkProps {
  /**
   * Whether a download icon comes before the text, as on the pill of the mobile menu.
   * @default false
   */
  hasIcon?: boolean;
  /** Called when the link is clicked, so the open mobile menu that holds it can close. */
  onClick?: () => void;
  /** Class name added by `styled(CvLink)`, so each place can give it its own shape. */
  className?: string;
}

/**
 * Link that downloads the CV of the site owner, a PDF, rather than opening it: the CV written in
 * the active language, generated from the content of the site by `pnpm cv`. Its text says what it
 * does, "Télécharger CV", which is also its name for screen readers and the words that speech
 * input users say. It has no shape of its own: the navigation gives it one with `styled(CvLink)`,
 * a pill with a download icon in the mobile menu and a text link in the bar of the header on
 * desktop.
 *
 * @example
 * const MenuCvLink = styled(CvLink)`
 *   border-radius: ${th.radius('pill')};
 * `;
 *
 * <MenuCvLink hasIcon onClick={closeMenu} />
 */
const CvLink = ({ hasIcon = false, onClick, className }: CvLinkProps) => {
  const { t, i18n } = useTranslation();

  return (
    <Link
      className={className}
      href={getCvUrl(i18n.resolvedLanguage)}
      download
      onClick={onClick}
    >
      {hasIcon && <Icon aria-hidden />}
      {t('cvLink.text')}
    </Link>
  );
};

export default CvLink;
