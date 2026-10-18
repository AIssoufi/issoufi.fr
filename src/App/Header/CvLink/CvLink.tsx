import { useTranslation } from 'react-i18next';

import { CV_URL } from './constants';
import { Icon, Link } from './CvLink.styled';

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
 * Link that downloads the CV of the site owner, a PDF, rather than opening it, written "CV". It
 * has no shape of its own: each place gives it one with `styled(CvLink)`, a pill with a download
 * icon in the mobile menu, and a round button without icon in the floating controls of the header
 * on desktop.
 *
 * Screen readers announce it by its translated name, "Télécharger le CV", which says what it does
 * even without the icon, and still holds the visible "CV" that speech input users say.
 *
 * @example
 * const FloatingCvLink = styled(CvLink)`
 *   border-radius: ${th.radius('circle')};
 * `;
 *
 * <FloatingCvLink />
 */
const CvLink = ({ hasIcon = false, onClick, className }: CvLinkProps) => {
  const { t } = useTranslation();

  return (
    <Link
      className={className}
      href={CV_URL}
      download
      aria-label={t('cvLink.label')}
      onClick={onClick}
    >
      {hasIcon && <Icon aria-hidden />}
      {t('cvLink.text')}
    </Link>
  );
};

export default CvLink;
