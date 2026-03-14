/**
 * Generic debounce hook.
 *
 * Returns a debounced version of `value` that only updates after `delay` ms
 * of inactivity. Used primarily by `PatientFilters` to debounce the search
 * input (default 300ms) so the API isn't called on every keystroke.
 */

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
