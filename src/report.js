import { describeError } from './download.js';

const BYTES_IN_KILOBYTE = 1000;
const BYTES_IN_MEGABYTE = 1_000_000;

export function formatHeader({ url, count }) {
  return [`Адрес: ${url.href}`, `Запросов: ${count} (последовательно)`, ''].join('\n');
}

export function formatRequestLine(index, total, result) {
  const label = `#${String(index).padStart(String(total).length, '0')}`;

  if (!result.ok) {
    return `${label}: ошибка — ${describeError(result.error)}`;
  }

  const kilobytes = (result.bytes / BYTES_IN_KILOBYTE).toFixed(1);

  return `${label}: ${kilobytes} КБ за ${formatMs(result.durationMs)}`;
}

export function formatSummary(summary) {
  if (summary.succeeded === 0) {
    return `Ни один из ${summary.requested} запросов не завершился успешно.`;
  }

  const rows = [
    ['Успешных запросов', `${summary.succeeded} из ${summary.requested}`],
    ['Среднее время', formatMs(summary.averageMs)],
    ['Медиана', formatMs(summary.medianMs)],
    ['Минимум / максимум', `${formatMs(summary.minMs)} / ${formatMs(summary.maxMs)}`],
    ['Скачано всего', `${(summary.totalBytes / BYTES_IN_MEGABYTE).toFixed(2)} МБ`],
    [
      'Скорость скачивания',
      `${summary.megabitsPerSecond.toFixed(2)} Мбит/с (${summary.megabytesPerSecond.toFixed(2)} МБ/с)`,
    ],
  ];

  const width = Math.max(...rows.map(([label]) => label.length)) + 2;
  const lines = rows.map(([label, value]) => `${`${label}:`.padEnd(width)}${value}`);

  return ['--- Результат ---', ...lines].join('\n');
}

export function formatJson({ url, results, summary }) {
  return JSON.stringify(
    {
      url: url.href,
      summary,
      requests: results.map(serializeResult),
    },
    null,
    2,
  );
}

function serializeResult(result) {
  if (result.ok) {
    return { ok: true, bytes: result.bytes, durationMs: result.durationMs };
  }

  return { ok: false, error: describeError(result.error) };
}

function formatMs(value) {
  return `${Math.round(value)} мс`;
}
