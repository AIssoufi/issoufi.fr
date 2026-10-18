import { useTranslation } from 'react-i18next';

import { GITHUB_PROFILE_URL } from './constants';
import GitHubIcon from './icons/github.svg?react';
import { Link } from './GitHubLink.styled';

/** Props of {@link GitHubLink}. Every prop is optional. */
interface GitHubLinkProps {
  /** Called when the link is clicked, so the open mobile menu that holds it can close. */
  onClick?: () => void;
  /** Class name added by `styled(GitHubLink)`, so each place can lay it out. */
  className?: string;
}

/**
 * Official GitHub icon, alone and without a frame, linking to the GitHub profile of the site owner
 * in a new tab. Light grey, it turns to the accent color of the buttons on hover. The header shows
 * it under the language toggle on desktop, and the mobile menu under the CV button.
 *
 * Screen readers announce it by its translated name, since the icon has no text.
 */
const GitHubLink = ({ onClick, className }: GitHubLinkProps) => {
  const { t } = useTranslation();

  return (
    <Link
      className={className}
      href={GITHUB_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('githubLink.label')}
      onClick={onClick}
    >
      <GitHubIcon aria-hidden />
    </Link>
  );
};

export default GitHubLink;
