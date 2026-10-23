// @ts-check

/**
 * Reads the message of an error that a script caught.
 * @param {unknown} error - The error.
 * @returns {string} Its message, or its text when it is not an `Error`.
 * @example
 * getErrorMessage(new Error('The GitHub API answered 500')); // 'The GitHub API answered 500'
 * getErrorMessage({ code: 1 }); // '[object Object]'
 */
export const getErrorMessage = error => (error instanceof Error ? error.message : String(error));
