type Assert = (condition: unknown, message?: string | (() => string)) => asserts condition;

export const assert: Assert = (condition, message = 'Assertion failed') => {
  if (!condition) {
    const messageText = typeof message === 'string' ? message : message();
    throw new Error(messageText);
  }
};
