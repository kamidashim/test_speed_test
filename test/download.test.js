import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { HttpError, describeError, download } from '../src/download.js';
import { PAYLOAD_SIZE, startServer } from '../test-support/server.js';

describe('download', () => {
  let server;

  before(async () => {
    server = await startServer();
  });

  after(() => server.close());

  const urlFor = (path) => new URL(path, server.baseUrl);

  it('returns the number of bytes received and a positive duration', async () => {
    const result = await download(urlFor('/file'), { timeoutMs: 5000 });

    assert.equal(result.bytes, PAYLOAD_SIZE);
    assert.ok(result.durationMs > 0);
  });

  it('rejects with HttpError on a non-2xx status', async () => {
    await assert.rejects(
      download(urlFor('/missing'), { timeoutMs: 5000 }),
      (error) => error instanceof HttpError && error.status === 404,
    );
  });

  it('aborts when the timeout elapses while the body is still being read', async () => {
    await assert.rejects(
      download(urlFor('/stall'), { timeoutMs: 150 }),
      (error) => error.name === 'TimeoutError',
    );
  });

  it('aborts when the caller signal fires', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50);

    await assert.rejects(
      download(urlFor('/stall'), { timeoutMs: 5000, signal: controller.signal }),
      (error) => error.name === 'AbortError',
    );
  });
});

describe('describeError', () => {
  it('describes HTTP errors', () => {
    assert.equal(describeError(new HttpError(503, 'Service Unavailable')), 'HTTP 503 Service Unavailable');
  });

  it('describes network failures by their cause code', () => {
    const error = new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });

    assert.equal(describeError(error), 'сетевая ошибка (ECONNREFUSED)');
  });
});
