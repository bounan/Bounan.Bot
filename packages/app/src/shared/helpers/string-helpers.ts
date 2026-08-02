export const eclipseText = (text: string, maxBefore: number, maxAfter: number): string => {
  if (text.length <= maxBefore + maxAfter + 1) {
    return text;
  }

  return `${text.slice(0, maxBefore).trim()} ... ${text.slice(-maxAfter).trim()}`;
};
