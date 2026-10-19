import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { PAGES } from '../src/utils/pages.ts';
import { SECURITY_HEADERS } from '../vite/constants.ts';
import { PAGE_SELECTOR, REPORT_POLICY_VIOLATION_FUNCTION } from './constants.ts';
import { getCheckedRoutes, isSecurityPolicyMessage } from './utils.ts';

/** What a page reports of a resource or inline code that its Content Security Policy blocked. */
interface PolicyViolation {
  /** Directive that blocked it, e.g. `img-src`. */
  directive: string;
  /** URL of the resource, or `inline` or `eval` for code written in the page. */
  blockedUri: string;
  /** File of the code that tried to load or run it, or `''` when the browser does not know it. */
  sourceFile: string;
  /** Line of that code in its file, or `0` when the browser does not know it. */
  lineNumber: number;
}

// Cloudflare Pages and vite preview send the same security headers (SECURITY_HEADERS): every
// page must work under its Content Security Policy, which blocks what the site does not serve
for (const language of LANGUAGES) {
  test.describe(`in ${language}`, () => {
    for (const route of getCheckedRoutes({ pages: PAGES, language })) {
      test(`${route} is served with the security headers, and breaks none of its policies`, async ({
        page,
      }) => {
        const violations: PolicyViolation[] = [];
        const policyMessages: string[] = [];
        await page.exposeFunction(REPORT_POLICY_VIOLATION_FUNCTION, (violation: PolicyViolation) =>
          violations.push(violation),
        );
        // An init script comes through the DevTools protocol, which the policy does not block, and
        // runs before the scripts of the page
        await page.addInitScript(functionName => {
          document.addEventListener('securitypolicyviolation', event => {
            const report = Reflect.get(window, functionName);
            report({
              directive: event.effectiveDirective,
              blockedUri: event.blockedURI,
              sourceFile: event.sourceFile,
              lineNumber: event.lineNumber,
            });
          });
        }, REPORT_POLICY_VIOLATION_FUNCTION);
        page.on('console', message => {
          if (isSecurityPolicyMessage(message.text())) policyMessages.push(message.text());
        });

        const response = await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        // The pages loaded lazily request their chunk, then their images, once the header shows
        await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
          await document.fonts.ready;
        });

        const headers = response?.headers() ?? {};
        Object.entries(SECURITY_HEADERS).forEach(([name, value]) => {
          // Playwright gives the names of the headers in lower case
          expect(headers[name.toLowerCase()], name).toBe(value);
        });
        expect(violations, 'securitypolicyviolation events').toEqual([]);
        expect(policyMessages, 'security policy messages in the console').toEqual([]);
      });
    }
  });
}
