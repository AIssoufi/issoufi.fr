import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import { GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL } from '../../../../constants/profiles';
import GitHubIcon from './icons/github.svg?react';
import LinkedInIcon from './icons/linkedin.svg?react';
import { Link, Row } from './ProfileLinks.styled';

/** A profile of the site owner that {@link ProfileLinks} links to. */
interface Profile {
  /** URL of the profile. Also used as the React key, so it must be unique. */
  url: string;
  /**
   * Translation key of the name of the link, which screen readers read, since the icon has no
   * text.
   */
  labelKey: string;
  /** Official icon of the site of the profile, drawn in the color of the link. */
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// Kept here rather than in constants.ts, which `pnpm cv` loads through Vite without the plugin
// that turns SVG files into components
/** Profiles of the site owner, in the order of their icons. */
const PROFILES: readonly Profile[] = [
  { url: GITHUB_PROFILE_URL, labelKey: 'githubLink.label', Icon: GitHubIcon },
  { url: LINKEDIN_PROFILE_URL, labelKey: 'linkedInLink.label', Icon: LinkedInIcon },
];

/** Props of {@link ProfileLinks}. Every prop is optional. */
interface ProfileLinksProps {
  /** Called when an icon is clicked, so the open mobile menu that holds them can close. */
  onClick?: () => void;
  /** Class name added by `styled(ProfileLinks)`, so the navigation can lay the row out. */
  className?: string;
}

/**
 * Row of the official GitHub then LinkedIn icons, alone and without a frame, each linking to the
 * profile of the site owner in a new tab, which gets no access to the site. Light grey, an icon
 * turns to the accent color of the buttons on hover. Large in the mobile menu, they are as high as
 * the text of the links in the bar of the header on desktop.
 *
 * Screen readers announce each one by its translated name, such as "Profil GitHub d’ADAM
 * Issoufi", since the icons have no text.
 *
 * @example
 * const MenuProfileLinks = styled(ProfileLinks)`
 *   padding: 0 ${th.space(16)};
 * `;
 *
 * <MenuProfileLinks onClick={closeMenu} />
 */
const ProfileLinks = ({ onClick, className }: ProfileLinksProps) => {
  const { t } = useTranslation();

  return (
    <Row className={className}>
      {PROFILES.map(({ url, labelKey, Icon }) => (
        <Link
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(labelKey)}
          onClick={onClick}
        >
          <Icon aria-hidden />
        </Link>
      ))}
    </Row>
  );
};

export default ProfileLinks;
