export const assert = (condition: boolean, message: string | (() => string) = 'Assertion failed') => {
  if (!condition) {
    const messageText = typeof message === 'string' ? message : message();
    throw new Error(messageText);
  }
};
