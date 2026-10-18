import { useTranslation } from 'react-i18next';

import { GITHUB_PROFILE_URL } from './constants';
import GitHubIcon from './icons/github.svg?react';
import { formatVersion } from './utils';

import { Container, Content, GitHubLink, Version } from './SiteFooter.styled';

/** Props of {@link SiteFooter}. Every prop is optional. */
interface SiteFooterProps {
  /**
   * Version of the site, as `package.json` writes it, e.g. `1.0.0`. Not shown when empty.
   * Defaults to the version of the build, which Vite reads from `package.json`.
   * @default __APP_VERSION__
   */
  version?: string;
}

/**
 * Footer of the site, fixed at the bottom of the screen above the content, at every width: the
 * deployed version (`v1.0.0`, see {@link formatVersion}) in the bottom left corner, lined up with
 * the logo of the header, and the official GitHub icon in the bottom right corner, lined up with
 * the right end of the navigation, which opens the owner's GitHub profile in a new tab. Both are
 * plain, without a frame. Rendered once by `App`, outside the routes, so it stays while a page
 * loads or fails. Every page keeps room under its content (`Page`, `src/components`), so its end
 * scrolls above the footer.
 *
 * Screen readers find it as the `contentinfo` landmark, and announce the icon by its translated
 * name, since it has no text.
 */
const SiteFooter = ({ version = __APP_VERSION__ }: SiteFooterProps) => {
  const { t } = useTranslation();
  const versionText = formatVersion(version);
  const showsVersion = versionText !== '';

  return (
    <Container>
      <Content>
        {showsVersion && <Version>{versionText}</Version>}
        <GitHubLink
          href={GITHUB_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('siteFooter.githubProfile')}
        >
          <GitHubIcon aria-hidden />
        </GitHubLink>
      </Content>
    </Container>
  );
};

export default SiteFooter;
