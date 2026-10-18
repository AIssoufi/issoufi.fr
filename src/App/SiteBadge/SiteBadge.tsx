import { useTranslation } from 'react-i18next';

import { GITHUB_PROFILE_URL, SITE_NAME } from './constants';
import GitHubIcon from './icons/github.svg?react';
import { formatSiteVersion } from './utils';

import { Container, GitHubLink, Version } from './SiteBadge.styled';

/** Props of {@link SiteBadge}. Every prop is optional. */
interface SiteBadgeProps {
  /**
   * Version of the site shown after its name, as `package.json` writes it, e.g. `1.0.0`. Left out
   * of the text when empty. Defaults to the version of the build, which Vite reads from
   * `package.json`.
   * @default __APP_VERSION__
   */
  version?: string;
}

/**
 * Footer of the site, fixed in the bottom left corner of the screen, above the content, at every
 * width: a round GitHub button, the size of a button of the language toggle, which opens the
 * owner's GitHub profile in a new tab, and the deployed version of the site
 * (`issoufi.fr v1.0.0`, see {@link formatSiteVersion}). Rendered once by `App`, outside the
 * routes, so it stays while a page loads or fails. Every page keeps room under its content
 * (`Page`, `src/components`), so its end scrolls above the badge.
 *
 * Screen readers find it as the `contentinfo` landmark, and announce the button by its
 * translated name, since its mark has no text.
 */
const SiteBadge = ({ version = __APP_VERSION__ }: SiteBadgeProps) => {
  const { t } = useTranslation();

  return (
    <Container>
      <GitHubLink
        href={GITHUB_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('siteBadge.githubProfile')}
      >
        <GitHubIcon aria-hidden />
      </GitHubLink>
      <Version>{formatSiteVersion({ siteName: SITE_NAME, version })}</Version>
    </Container>
  );
};

export default SiteBadge;
