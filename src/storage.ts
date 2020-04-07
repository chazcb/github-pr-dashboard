export const setItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

export const getItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {}
  return null;
};
