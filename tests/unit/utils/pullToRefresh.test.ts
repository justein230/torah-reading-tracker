import { computePullDistance, shouldTriggerRefresh, PULL_THRESHOLD, MAX_PULL, PULL_RESISTANCE } from '../../../src/utils/pullToRefresh.js';

describe('computePullDistance', () => {
  it('returns 0 for an upward or zero drag', () => {
    expect(computePullDistance(0)).toBe(0);
    expect(computePullDistance(-40)).toBe(0);
  });

  it('applies the resistance factor below the cap', () => {
    expect(computePullDistance(40)).toBe(40 * PULL_RESISTANCE);
  });

  it('caps the distance at MAX_PULL for large drags', () => {
    expect(computePullDistance(10000)).toBe(MAX_PULL);
  });
});

describe('shouldTriggerRefresh', () => {
  it('is false below the threshold', () => {
    expect(shouldTriggerRefresh(PULL_THRESHOLD - 1)).toBe(false);
  });

  it('is true at or above the threshold', () => {
    expect(shouldTriggerRefresh(PULL_THRESHOLD)).toBe(true);
    expect(shouldTriggerRefresh(PULL_THRESHOLD + 10)).toBe(true);
  });
});
