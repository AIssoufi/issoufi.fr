import { isNonBlankString } from '../../../../utils/strings.ts';
import type { ProjectItemData } from '../types.ts';

/**
 * Returns the url that the card title links to, or `undefined` when the card gets no link: it
 * needs a url to open, and a name for the link text, without which screen readers would announce
 * an unnamed link.
 *
 * @param project - Card data, which may come from JSON with missing or wrong fields; `null` or
 * `undefined` gets no link.
 *
 * @example
 * getProjectLinkUrl({ url: 'https://example.com', name: 'Chess' }); // 'https://example.com'
 * getProjectLinkUrl({ url: 'https://example.com', name: '' }); // undefined
 */
export function getProjectLinkUrl(
  project?: Partial<Pick<ProjectItemData, 'url' | 'name'>> | null,
): string | undefined {
  const { url, name } = project ?? {};
  const canLink = isNonBlankString(url) && isNonBlankString(name);
  return canLink ? url : undefined;
}
