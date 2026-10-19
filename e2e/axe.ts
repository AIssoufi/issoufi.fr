import type { Page } from '@playwright/test';
import axe, { type Result } from 'axe-core';

/** Parameters of {@link runAxeRules}. */
interface RunAxeRulesParams {
  /** Page of the test, loaded, whose whole document is checked. */
  page: Page;
  /** Identifiers of the axe-core rules to run, such as `color-contrast`; the others are skipped. */
  rules: readonly string[];
}

/**
 * Runs rules of axe-core on the whole document of a page, in the browser: runs the script of
 * axe-core in the page, unless it already holds it, then runs only the given rules. The script is
 * evaluated through the DevTools protocol rather than added as an inline `<script>`, which the
 * Content Security Policy of the site blocks.
 *
 * @returns The violations, one per rule that some elements fail, each with those elements; empty
 * when every element passes. An element that axe-core cannot judge, such as a text over a photo,
 * is not a violation.
 *
 * @example
 * const violations = await runAxeRules({ page, rules: ['color-contrast'] });
 */
export const runAxeRules = async ({ page, rules }: RunAxeRulesParams): Promise<Result[]> => {
  const hasAxe = await page.evaluate(() => 'axe' in window);
  if (!hasAxe) await page.evaluate(axe.source);

  const results = await page.evaluate(
    ruleIds =>
      (window as unknown as { axe: typeof axe }).axe.run(document, {
        runOnly: { type: 'rule', values: ruleIds },
      }),
    [...rules],
  );
  return results.violations;
};

/** A violation of axe-core, of which only its rule and the elements that fail it are described. */
type AxeViolation = Pick<Result, 'id' | 'nodes'>;

/** Spaces and line breaks of the summary of a failure, which axe-core writes on several lines. */
const SUMMARY_SPACES_PATTERN = /\s+/g;

/**
 * Describes each element that fails a rule of axe-core on one line, for the message of a failed
 * test: the rule, the selector of the element, then what fails, such as the contrast measured.
 *
 * @param violations - Violations returned by {@link runAxeRules}.
 * @returns One description per failing element, in order; empty when there is none, or when the
 * violations are not an array. A violation without elements adds nothing.
 *
 * @example
 * describeAxeViolations(violations);
 * // ['color-contrast: .active: Fix any of the following: Element has insufficient color
 * //   contrast of 2.73 (foreground color: #8b3168, background color: #000000, …)']
 */
export const describeAxeViolations = (violations?: readonly AxeViolation[] | null): string[] => {
  const violationList: readonly AxeViolation[] = Array.isArray(violations) ? violations : [];
  return violationList.flatMap(({ id, nodes }) =>
    (nodes ?? []).map(({ target, failureSummary }) => {
      const selector = (target ?? []).flat().join(' ');
      const summary = (failureSummary ?? '').replace(SUMMARY_SPACES_PATTERN, ' ').trim();
      return `${id}: ${selector}: ${summary}`;
    }),
  );
};
