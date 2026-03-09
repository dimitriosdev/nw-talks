import { useCallback } from "react";

/**
 * useScrollPosition - Custom hook for saving/restoring scroll position
 * @param {string} key - sessionStorage key
 * @returns {object} { save, restore }
 */
export function useScrollPosition(key: string) {
  const save = useCallback(() => {
    sessionStorage.setItem(key, String(window.scrollY));
  }, [key]);
  const restore = useCallback(() => {
    const y = sessionStorage.getItem(key);
    if (y) {
      window.scrollTo({ top: Number(y), behavior: "auto" });
      sessionStorage.removeItem(key);
    }
  }, [key]);
  return { save, restore };
}
