export const SAVED_ABIS = 'SAVED_ABIS';
export const SAVED_HIDDEN_METHODS = 'SAVED_HIDDEN_METHODS';

export const loadState: any = (storageKey: string) => {
  try {
    const serializedState = localStorage.getItem(storageKey);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

export const saveState: any = (storageKey: string, state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(storageKey, serializedState);
  } catch (err) {
    // Ignore write errors.
  }
};
