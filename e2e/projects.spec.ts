import { SHOW_ALL_BUTTON_NAME } from './constants.ts';
import { showAllProjects } from './projects.ts';

/** Parameters of {@link fakePage}. */
interface FakePageParams {
  /** Number of "Show all" buttons that the page shows. */
  buttonCount: number;
  /** Error that waiting for the first button rejects with, as when the page shows none. */
  waitError?: Error;
}

/**
 * Fakes a Projects page whose "Show all" buttons each become "Show less" once clicked, and records
 * the calls made to it in their order.
 */
const fakePage = ({ buttonCount, waitError }: FakePageParams) => {
  let shownButtonCount = buttonCount;
  const calls: string[] = [];
  const firstButton = {
    waitFor: vi.fn(async () => {
      calls.push('waitFor');
      if (waitError) throw waitError;
    }),
    click: vi.fn(async () => {
      calls.push('click');
      shownButtonCount -= 1;
    }),
  };
  const buttons = { first: () => firstButton, count: async () => shownButtonCount };
  const getByRole = vi.fn(() => buttons);
  return { page: { getByRole } as never, getByRole, firstButton, calls };
};

describe('showAllProjects', () => {
  it('waits for the "Show all" buttons, then clicks the first one left until none is', async () => {
    const { page, getByRole, calls } = fakePage({ buttonCount: 2 });

    await showAllProjects(page);

    expect(getByRole).toHaveBeenCalledExactlyOnceWith('button', { name: SHOW_ALL_BUTTON_NAME });
    expect(calls).toEqual(['waitFor', 'click', 'click']);
  });

  it('clicks nothing when no "Show all" button is left after the wait', async () => {
    const { page, firstButton } = fakePage({ buttonCount: 0 });

    await showAllProjects(page);

    expect(firstButton.click).not.toHaveBeenCalled();
  });

  it('rejects without clicking when the page shows no "Show all" button in time', async () => {
    const waitError = new Error('Timeout: waiting for "Show all" to be visible');
    const { page, firstButton } = fakePage({ buttonCount: 2, waitError });

    await expect(showAllProjects(page)).rejects.toBe(waitError);
    expect(firstButton.click).not.toHaveBeenCalled();
  });
});
