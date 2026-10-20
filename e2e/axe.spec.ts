import type { Page } from '@playwright/test';
import axe from 'axe-core';

import { describeAxeViolations, runAxeRules } from './axe.ts';

/** A failure of the contrast rule, as axe-core describes it, on several lines. */
const CONTRAST_SUMMARY =
  'Fix any of the following:\n  Element has insufficient color contrast of 2.73 (foreground color: #8b3168)';

/** The same failure on one line, as {@link describeAxeViolations} writes it. */
const CONTRAST_SUMMARY_LINE =
  'Fix any of the following: Element has insufficient color contrast of 2.73 (foreground color: #8b3168)';

/** Parameters of {@link fakePage}. */
interface FakePageParams {
  /** Whether the page already holds the script of axe-core. */
  hasAxe: boolean;
  /** Violations that axe-core finds in the page. */
  violations: unknown[];
}

/** Function that a test runs in place of the browser, with the argument that it receives. */
type BrowserFunction = (argument?: unknown) => unknown;

/**
 * A fake page of Playwright, whose `evaluate` answers whether it holds axe-core, runs its script,
 * then gives the results of the rules that it runs.
 */
const fakePage = ({ hasAxe, violations }: FakePageParams) => {
  let pageFunctionCount = 0;
  const evaluate = vi.fn<(pageFunction: unknown, argument?: unknown) => Promise<unknown>>(
    async pageFunction => {
      if (pageFunction === axe.source) return undefined;
      pageFunctionCount += 1;
      const isAxeCheck = pageFunctionCount === 1;
      return isAxeCheck ? hasAxe : { violations };
    },
  );
  return { page: { evaluate } as unknown as Page, evaluate };
};

describe('runAxeRules', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs axe-core in the page, then only the given rules, and returns their violations', async () => {
    const violations = [{ id: 'color-contrast', nodes: [] }];
    const { page, evaluate } = fakePage({ hasAxe: false, violations });

    await expect(runAxeRules({ page, rules: ['color-contrast'] })).resolves.toEqual(violations);
    // Through the DevTools protocol, which the Content Security Policy of the site does not block
    expect(evaluate).toHaveBeenCalledWith(axe.source);
    expect(evaluate).toHaveBeenLastCalledWith(expect.any(Function), ['color-contrast']);
  });

  it('runs axe-core only once in a page that already holds it', async () => {
    const { page, evaluate } = fakePage({ hasAxe: true, violations: [] });

    await expect(runAxeRules({ page, rules: ['color-contrast'] })).resolves.toEqual([]);
    expect(evaluate).not.toHaveBeenCalledWith(axe.source);
  });

  it('runs the rules in the browser with axe-core, on the whole document', async () => {
    const { page, evaluate } = fakePage({ hasAxe: true, violations: [] });
    const run = vi.fn().mockResolvedValue({ violations: [] });
    vi.stubGlobal('axe', { run });

    await runAxeRules({ page, rules: ['color-contrast'] });
    const [runInBrowser, ruleIds] = evaluate.mock.calls[1] as [BrowserFunction, unknown];
    await runInBrowser(ruleIds);

    expect(run).toHaveBeenCalledExactlyOnceWith(document, {
      runOnly: { type: 'rule', values: ['color-contrast'] },
    });
  });

  it('asks the page whether it holds axe-core', async () => {
    const { page, evaluate } = fakePage({ hasAxe: true, violations: [] });

    await runAxeRules({ page, rules: [] });
    const [hasAxeInBrowser] = evaluate.mock.calls[0] as [BrowserFunction];
    // Importing axe-core in jsdom already gave the window an `axe`
    const browserWindow = window as unknown as { axe?: unknown };
    const importedAxe = browserWindow.axe;

    delete browserWindow.axe;
    expect(hasAxeInBrowser()).toBe(false);
    browserWindow.axe = importedAxe;
    expect(hasAxeInBrowser()).toBe(true);
  });
});

describe('describeAxeViolations', () => {
  it('describes each failing element on one line, with its rule and its selector', () => {
    const violations = [
      {
        id: 'color-contrast',
        nodes: [
          { target: ['.active'], failureSummary: CONTRAST_SUMMARY },
          { target: ['iframe', ['.inside']], failureSummary: 'Fix it' },
        ],
      },
      { id: 'image-alt', nodes: [{ target: ['img'], failureSummary: 'Add an alt' }] },
    ];

    expect(describeAxeViolations(violations as never)).toEqual([
      `color-contrast: .active: ${CONTRAST_SUMMARY_LINE}`,
      'color-contrast: iframe .inside: Fix it',
      'image-alt: img: Add an alt',
    ]);
  });

  it('describes an element without a selector or a summary all the same', () => {
    const violations = [{ id: 'color-contrast', nodes: [{}] }];

    expect(describeAxeViolations(violations as never)).toEqual(['color-contrast: : ']);
  });

  it('adds nothing for a violation without elements', () => {
    expect(describeAxeViolations([{ id: 'color-contrast', nodes: [] }])).toEqual([]);
    expect(describeAxeViolations([{ id: 'color-contrast' }] as never)).toEqual([]);
  });

  it.each([
    ['no violations', []],
    ['nothing', undefined],
    ['null', null],
    ['an object', { id: 'color-contrast' }],
  ])('describes nothing for %s', (_case, violations) => {
    expect(describeAxeViolations(violations as never)).toEqual([]);
  });
});
