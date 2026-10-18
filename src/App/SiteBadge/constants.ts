import { SITE_URL } from '../../utils/pages';

/** GitHub profile of the site owner, which the GitHub button of the site badge opens. */
export const GITHUB_PROFILE_URL = 'https://github.com/AIssoufi';

/** Name of the site shown before its version in the site badge: the host of its URL. */
export const SITE_NAME = new URL(SITE_URL).host;

/** Letter written before a version number, as in `v1.0.0`. */
export const VERSION_PREFIX = 'v';
