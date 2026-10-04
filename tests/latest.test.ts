import { describe, expect, it } from 'vitest';
import { latestOnly } from '../src/lib/latest';

describe('latestOnly', () => {
  it('reports only the newest request as current', () => {
    const guard = latestOnly();
    const a = guard.next();
    const b = guard.next();
    expect(guard.isCurrent(a)).toBe(false);
    expect(guard.isCurrent(b)).toBe(true);
  });
  it('cancel() makes every earlier request stale, e.g. when the search box is cleared', () => {
    const guard = latestOnly();
    const a = guard.next();
    guard.cancel();
    expect(guard.isCurrent(a)).toBe(false);
  });
});
