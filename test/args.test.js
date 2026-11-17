import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_COUNT, DEFAULT_TIMEOUT_MS, UsageError, parseCli } from '../src/args.js';

describe('parseCli', () => {
  it('applies defaults', () => {
    const options = parseCli(['https://example.com/a.jpg']);

    assert.equal(options.url.href, 'https://example.com/a.jpg');
    assert.equal(options.count, DEFAULT_COUNT);
    assert.equal(options.timeoutMs, DEFAULT_TIMEOUT_MS);
    assert.equal(options.json, false);
  });

  it('reads long and short options', () => {
    const options = parseCli(['-n', '3', '--timeout', '500', '--json', 'http://localhost:8080/x']);

    assert.equal(options.count, 3);
    assert.equal(options.timeoutMs, 500);
    assert.equal(options.json, true);
  });

  it('returns help without requiring a url', () => {
    assert.deepEqual(parseCli(['--help']), { help: true });
  });

  it('rejects a missing url', () => {
    assert.throws(() => parseCli([]), UsageError);
  });

  it('rejects more than one url', () => {
    assert.throws(() => parseCli(['http://a.test', 'http://b.test']), UsageError);
  });

  it('rejects a malformed url', () => {
    assert.throws(() => parseCli(['not-a-url']), UsageError);
  });

  it('rejects unsupported protocols', () => {
    assert.throws(() => parseCli(['ftp://example.com/file']), UsageError);
  });

  it('rejects invalid counts and timeouts', () => {
    for (const value of ['0', '-1', '1.5', 'abc', '']) {
      assert.throws(() => parseCli(['-n', value, 'http://a.test']), UsageError, `count=${value}`);
      assert.throws(() => parseCli(['-t', value, 'http://a.test']), UsageError, `timeout=${value}`);
    }
  });

  it('rejects unknown options', () => {
    assert.throws(() => parseCli(['--nope', 'http://a.test']), UsageError);
  });
});
