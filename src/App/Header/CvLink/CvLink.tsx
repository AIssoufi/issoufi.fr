import { useTranslation } from 'react-i18next';

import { Icon, Link } from './CvLink.styled';
import Tooltip, { type TooltipPlacement } from './Tooltip';
import { getCvUrl } from './utils';

/** Props of {@link CvLink}. Every prop is optional. */
interface CvLinkProps {
  /**
   * Whether a download icon comes before the text, as on the pill of the mobile menu.
   * @default false
   */
  hasIcon?: boolean;
  /**
   * Side of the link on which its tooltip shows: `left` in the floating controls on desktop,
   * which stand against the right edge of the screen, `top` in the mobile menu, where the GitHub
   * icon sits under it.
   * @default 'top', the default side of the tooltip
   */
  tooltipPlacement?: TooltipPlacement;
  /** Called when the link is clicked, so the open mobile menu that holds it can close. */
  onClick?: () => void;
  /**
   * Class name added by `styled(CvLink)`, so each place can give it its own shape. It applies to
   * the link: give it no margin, which would move the tooltip away from it.
   */
  className?: string;
}

/**
 * Link that downloads the CV of the site owner, a PDF, rather than opening it, written "CV": the
 * CV written in the active language, generated from the content of the site by `pnpm cv`. It
 * has no shape of its own: each place gives it one with `styled(CvLink)`, a pill with a download
 * icon in the mobile menu, and a round button without icon in the floating controls of the header
 * on desktop.
 *
 * Its {@link Tooltip} says what it does, "Télécharger le CV", next to it while a mouse hovers it or
 * the keyboard focuses it, never on a tap. That text is also its name for screen readers
 * (`aria-labelledby`), which browsers read from the tooltip even while it is hidden: they announce
 * it once, rather than once as the name and again as a description. The name says what the link
 * does even without the icon, and still holds the visible "CV" that speech input users say.
 *
 * @example
 * const FloatingCvLink = styled(CvLink)`
 *   border-radius: ${th.radius('circle')};
 * `;
 *
 * <FloatingCvLink tooltipPlacement="left" />
 */
const CvLink = ({ hasIcon = false, tooltipPlacement, onClick, className }: CvLinkProps) => {
  const { t, i18n } = useTranslation();

  return (
    <Tooltip
      text={t('cvLink.label')}
      placement={tooltipPlacement}
    >
      {tooltipId => (
        <Link
          className={className}
          href={getCvUrl(i18n.resolvedLanguage)}
          download
          aria-labelledby={tooltipId}
          onClick={onClick}
        >
          {hasIcon && <Icon aria-hidden />}
          {t('cvLink.text')}
        </Link>
      )}
    </Tooltip>
  );
};

export default CvLink;
