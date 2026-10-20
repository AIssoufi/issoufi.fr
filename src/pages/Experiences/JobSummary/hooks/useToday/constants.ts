/**
 * First day of the month of the build (`__BUILD_MONTH__`): the today of the pages that the build
 * renders, whose durations count in whole months.
 */
export const BUILD_MONTH_START = new Date(__BUILD_MONTH__.year, __BUILD_MONTH__.monthIndex, 1);
