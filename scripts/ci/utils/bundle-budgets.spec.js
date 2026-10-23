import { checkBundleBudgets, checkScriptBudget } from './bundle-budgets.mjs';

describe('checkScriptBudget', () => {
  it('adds up the gzip sizes', () => {
    const scripts = [{ gzipBytes: 100 }, { gzipBytes: 50 }];
    expect(checkScriptBudget({ scripts, budgetBytes: 200 })).toEqual({
      totalGzipBytes: 150,
      isOverBudget: false,
    });
  });

  it('accepts a total equal to the budget', () => {
    const scripts = [{ gzipBytes: 200 }];
    expect(checkScriptBudget({ scripts, budgetBytes: 200 }).isOverBudget).toBe(false);
  });

  it('rejects a total one byte over the budget', () => {
    const scripts = [{ gzipBytes: 201 }];
    expect(checkScriptBudget({ scripts, budgetBytes: 200 }).isOverBudget).toBe(true);
  });

  it.each([undefined, null, 'assets/index.js', {}])('gives 0 for the scripts %o', scripts => {
    expect(checkScriptBudget({ scripts, budgetBytes: 200 })).toEqual({
      totalGzipBytes: 0,
      isOverBudget: false,
    });
  });

  it('counts invalid gzip sizes as 0', () => {
    const scripts = [{ gzipBytes: NaN }, { gzipBytes: -10 }, {}, null, { gzipBytes: 30 }];
    expect(checkScriptBudget({ scripts, budgetBytes: 200 }).totalGzipBytes).toBe(30);
  });

  it.each([0, -1, NaN, Infinity, undefined, null, '200'])(
    'throws for the invalid budget %s',
    budgetBytes => {
      expect(() => checkScriptBudget({ scripts: [], budgetBytes })).toThrow(RangeError);
    },
  );
});

describe('checkBundleBudgets', () => {
  const main = { path: 'assets/index-abc.js', bytes: 403_180, gzipBytes: 131_860 };
  const page = { path: 'assets/Projects-abc.js', bytes: 14_140, gzipBytes: 4_520 };
  const budgets = { budgetBytes: 210_000, initialLoadBudgetBytes: 150_000 };

  it('checks the initial load and all the scripts against their budgets', () => {
    expect(
      checkBundleBudgets({ scripts: [page, main], initialPaths: [main.path], ...budgets }),
    ).toEqual({
      initialScripts: [main],
      otherScripts: [page],
      hasInitialLoad: true,
      initialLoad: { totalGzipBytes: 131_860, isOverBudget: false },
      total: { totalGzipBytes: 136_380, isOverBudget: false },
    });
  });

  it('fails the initial load over its budget, even with the total within its own', () => {
    const { initialLoad, total } = checkBundleBudgets({
      scripts: [page, main],
      initialPaths: [main.path],
      budgetBytes: 210_000,
      initialLoadBudgetBytes: 131_859,
    });
    expect(initialLoad.isOverBudget).toBe(true);
    expect(total.isOverBudget).toBe(false);
  });

  it('fails the total over its budget, even with the initial load within its own', () => {
    const { initialLoad, total } = checkBundleBudgets({
      scripts: [page, main],
      initialPaths: [main.path],
      budgetBytes: 136_379,
      initialLoadBudgetBytes: 150_000,
    });
    expect(initialLoad.isOverBudget).toBe(false);
    expect(total.isOverBudget).toBe(true);
  });

  it('accepts sizes equal to the budgets', () => {
    const { initialLoad, total } = checkBundleBudgets({
      scripts: [page, main],
      initialPaths: [main.path],
      budgetBytes: 136_380,
      initialLoadBudgetBytes: 131_860,
    });
    expect(initialLoad.isOverBudget).toBe(false);
    expect(total.isOverBudget).toBe(false);
  });

  it.each([undefined, null, {}, [], main.path, ['register-sw.js']])(
    'has no initial load for the initial paths %o',
    initialPaths => {
      expect(checkBundleBudgets({ scripts: [page, main], initialPaths, ...budgets })).toEqual({
        initialScripts: [],
        otherScripts: [page, main],
        hasInitialLoad: false,
        initialLoad: { totalGzipBytes: 0, isOverBudget: false },
        total: { totalGzipBytes: 136_380, isOverBudget: false },
      });
    },
  );

  it.each([undefined, null, {}, [], [null, { gzipBytes: 9_000 }, { path: '' }]])(
    'has no initial load and sizes of 0 for the scripts %o',
    scripts => {
      expect(checkBundleBudgets({ scripts, initialPaths: [main.path], ...budgets })).toEqual({
        initialScripts: [],
        otherScripts: [],
        hasInitialLoad: false,
        initialLoad: { totalGzipBytes: 0, isOverBudget: false },
        total: { totalGzipBytes: 0, isOverBudget: false },
      });
    },
  );

  it.each([0, -1, NaN, Infinity, undefined, null, '210000'])(
    'throws for the invalid budget %s',
    budgetBytes => {
      expect(() => checkBundleBudgets({ ...budgets, budgetBytes })).toThrow(RangeError);
    },
  );

  it.each([0, -1, NaN, Infinity, undefined, null, '150000'])(
    'throws for the invalid initial load budget %s',
    initialLoadBudgetBytes => {
      expect(() => checkBundleBudgets({ ...budgets, initialLoadBudgetBytes })).toThrow(RangeError);
    },
  );
});
