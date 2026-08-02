export const dubToKey = (dub: string) => {
  return dub.trim().toLowerCase().replaceAll(' ', '_');
};
