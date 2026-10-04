/** Tracks the newest of several async requests so stale results can be dropped. */
export function latestOnly() {
  let current = 0;
  return {
    next: () => ++current,
    isCurrent: (token: number) => token === current,
    cancel: () => { current++; },
  };
}
