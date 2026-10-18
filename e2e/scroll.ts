/**
 * Reads the scroll position of the page. Runs in the browser, passed to `page.evaluate`, so it uses
 * nothing from outside its own body.
 *
 * @returns The distance the page is scrolled down, in CSS pixels.
 *
 * @example
 * await page.evaluate(getPageScrollY); // 300
 */
export const getPageScrollY = (): number => window.scrollY;

/**
 * Scrolls the page to its end at once, whatever its scroll behavior. Runs in the browser, passed
 * to `page.evaluate`, so it uses nothing from outside its own body.
 *
 * @returns The scroll position reached, in CSS pixels: `0` for a page no higher than the screen.
 *
 * @example
 * await page.evaluate(scrollToEnd); // 2764
 */
export const scrollToEnd = (): number => {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
  return window.scrollY;
};
