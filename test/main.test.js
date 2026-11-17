import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ExitCode, main } from '../src/main.js';
import { startServer } from '../test-support/server.js';

function createSink() {
  const chunks = [];

  return {
    write(text) {
      chunks.push(text);
      return true;
    },
    text: () => chunks.join(''),
  };
}

async function run(argv, extra = {}) {
  const stdout = createSink();
  const stderr = createSink();
  const code = await main(argv, { stdout, stderr, ...extra });

  return { code, stdout: stdout.text(), stderr: stderr.text() };
}

describe('main', () => {
  let server;

  before(async () => {
    server = await startServer();
  });

  after(() => server.close());

  it('prints a report and exits with 0 when all requests succeed', async () => {
    const { code, stdout } = await run(['-n', '3', `${server.baseUrl}/file`]);

    assert.equal(code, ExitCode.OK);
    assert.match(stdout, /#1:/);
    assert.match(stdout, /#3:/);
    assert.match(stdout, /Успешных запросов:\s+3 из 3/);
    assert.match(stdout, /Скорость скачивания:\s+[\d.]+ Мбит\/с/);
  });

  it('prints machine-readable output with --json', async () => {
    const { code, stdout } = await run(['-n', '2', '--json', `${server.baseUrl}/file`]);
    const report = JSON.parse(stdout);

    assert.equal(code, ExitCode.OK);
    assert.equal(report.requests.length, 2);
    assert.equal(report.summary.succeeded, 2);
    assert.ok(report.summary.megabitsPerSecond > 0);
  });

  it('exits with 1 and reports errors when requests fail', async () => {
    const { code, stdout } = await run(['-n', '2', `${server.baseUrl}/missing`]);

    assert.equal(code, ExitCode.FAILED);
    assert.match(stdout, /ошибка — HTTP 404/);
    assert.match(stdout, /Ни один из 2 запросов/);
  });

  it('exits with 2 and prints usage for invalid arguments', async () => {
    const { code, stderr } = await run(['not-a-url']);

    assert.equal(code, ExitCode.USAGE);
    assert.match(stderr, /Использование:/);
  });

  it('prints help and exits with 0', async () => {
    const { code, stdout } = await run(['--help']);

    assert.equal(code, ExitCode.OK);
    assert.match(stdout, /Использование:/);
  });

  it('stops without a report when interrupted', async () => {
    const controller = new AbortController();
    controller.abort();

    const { code, stdout } = await run([`${server.baseUrl}/file`], { signal: controller.signal });

    assert.equal(code, ExitCode.INTERRUPTED);
    assert.doesNotMatch(stdout, /Результат/);
  });
});
