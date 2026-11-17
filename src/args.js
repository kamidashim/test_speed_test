import { parseArgs } from 'node:util';

export const DEFAULT_COUNT = 10;
export const DEFAULT_TIMEOUT_MS = 60_000;

export const USAGE = [
  'Использование: node speedtest.js [опции] <url>',
  '',
  'Опции:',
  '  -n, --count <число>   количество запросов (по умолчанию 10)',
  '  -t, --timeout <мс>    таймаут одного запроса (по умолчанию 60000)',
  '      --json            вывести результат в формате JSON',
  '  -h, --help            показать справку',
].join('\n');

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageError';
  }
}

export function parseCli(argv) {
  const { values, positionals } = readArgs(argv);

  if (values.help) {
    return { help: true };
  }

  if (positionals.length !== 1) {
    throw new UsageError('нужно указать ровно один адрес');
  }

  return {
    help: false,
    url: parseUrl(positionals[0]),
    count: parsePositiveInteger(values.count, DEFAULT_COUNT, 'count'),
    timeoutMs: parsePositiveInteger(values.timeout, DEFAULT_TIMEOUT_MS, 'timeout'),
    json: values.json,
  };
}

function readArgs(argv) {
  try {
    return parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        count: { type: 'string', short: 'n' },
        timeout: { type: 'string', short: 't' },
        json: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
    });
  } catch (error) {
    throw new UsageError(error.message);
  }
}

function parseUrl(raw) {
  let url;

  try {
    url = new URL(raw);
  } catch {
    throw new UsageError(`некорректный адрес: ${raw}`);
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new UsageError(`поддерживаются только http и https: ${raw}`);
  }

  return url;
}

function parsePositiveInteger(raw, fallback, name) {
  if (raw === undefined) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isSafeInteger(value) || value < 1) {
    throw new UsageError(`--${name} должен быть целым числом больше нуля`);
  }

  return value;
}
