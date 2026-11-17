import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { summarize } from '../src/stats.js';

const success = (bytes, durationMs) => ({ ok: true, bytes, durationMs });
const failure = () => ({ ok: false, error: new Error('boom') });

describe('summarize', () => {
  it('computes speed from total bytes and total time', () => {
    const summary = summarize([success(1_000_000, 1000), success(1_000_000, 1000)]);

    assert.equal(summary.totalBytes, 2_000_000);
    assert.equal(summary.averageMs, 1000);
    assert.equal(summary.megabytesPerSecond, 1);
    assert.equal(summary.megabitsPerSecond, 8);
  });

  it('excludes failed requests from every metric', () => {
    const summary = summarize([success(500_000, 500), failure(), success(500_000, 500)]);

    assert.equal(summary.requested, 3);
    assert.equal(summary.succeeded, 2);
    assert.equal(summary.failed, 1);
    assert.equal(summary.totalBytes, 1_000_000);
    assert.equal(summary.averageMs, 500);
  });

  it('computes median for odd and even sample sizes', () => {
    assert.equal(summarize([success(1, 10), success(1, 30), success(1, 20)]).medianMs, 20);
    assert.equal(summarize([success(1, 10), success(1, 40), success(1, 20), success(1, 30)]).medianMs, 25);
  });

  it('reports minimum and maximum duration', () => {
    const summary = summarize([success(1, 30), success(1, 10), success(1, 20)]);

    assert.equal(summary.minMs, 10);
    assert.equal(summary.maxMs, 30);
  });

  it('handles the case when every request failed', () => {
    const summary = summarize([failure(), failure()]);

    assert.equal(summary.succeeded, 0);
    assert.equal(summary.averageMs, null);
    assert.equal(summary.medianMs, null);
    assert.equal(summary.megabitsPerSecond, 0);
  });
});
