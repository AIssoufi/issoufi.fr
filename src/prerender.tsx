import { ServerStyleSheet } from '@xstyled/styled-components';
import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';

import App from './App/App.tsx';
import i18n from './i18n/index.ts';
import { getPathLanguage } from './i18n/utils.ts';
import { type PrerenderPage, removeLeadingLinks } from './utils/prerender.ts';

/**
 * Renders the app at a path, in the language of that path, to the HTML that the browser shows
 * before running any script: the header, the page and its lazily loaded parts, once loaded, and
 * the styles that they use. The build runs it in Node.js (`vite/prerender/`), one page after
 * another, since the language of i18next is shared.
 *
 * @param path - Path of the page, such as `/en/projects`.
 * @returns The markup of the app and its styles.
 * @throws The first error of the render, such as a component that throws, so that the build fails
 * rather than writes a page that the browser would render again from scratch.
 *
 * @example
 * const { html, styleTags } = await prerenderPage('/en/projects');
 */
export const prerenderPage: PrerenderPage = async path => {
  await i18n.changeLanguage(getPathLanguage(path));

  const errors: unknown[] = [];
  const sheet = new ServerStyleSheet();
  try {
    const { prelude } = await prerender(
      sheet.collectStyles(
        <StrictMode>
          <App location={path} />
        </StrictMode>,
      ),
      {
        // Every boundary in place, however large: React would otherwise move a large one to the
        // end of the page, with an inline script to put it back, which the policy blocks
        progressiveChunkSize: Number.POSITIVE_INFINITY,
        onError: error => void errors.push(error),
      },
    );
    const html = await new Response(prelude).text();
    if (errors.length > 0) throw errors[0];

    return { html: removeLeadingLinks(html), styleTags: sheet.getStyleTags() };
  } finally {
    sheet.seal();
  }
};
