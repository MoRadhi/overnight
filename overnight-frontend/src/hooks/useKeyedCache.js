import { useRef, useCallback, useMemo } from "react";

/**
 * Per-key in-memory cache for list/detail fetches triggered by a filter
 * (e.g. a hotel dropdown). Switching back to a previously seen key reuses
 * the cached result instead of re-hitting the backend. Call invalidate()
 * after any mutation that could make cached data stale.
 */
export function useKeyedCache() {
  const cacheRef = useRef(new Map());

  const get = useCallback((key) => cacheRef.current.get(key), []);
  const set = useCallback((key, value) => cacheRef.current.set(key, value), []);
  const invalidate = useCallback((key) => {
    if (key === undefined) {
      cacheRef.current.clear();
    } else {
      cacheRef.current.delete(key);
    }
  }, []);

  return useMemo(() => ({ get, set, invalidate }), [get, set, invalidate]);
}
