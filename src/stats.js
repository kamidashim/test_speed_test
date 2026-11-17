const MS_IN_SECOND = 1000;
const BITS_IN_BYTE = 8;
const BYTES_IN_MEGABYTE = 1_000_000;

export function summarize(results) {
  const successes = results.filter((result) => result.ok);
  const durations = successes.map((result) => result.durationMs);
  const totalBytes = sum(successes.map((result) => result.bytes));
  const totalMs = sum(durations);
  const bytesPerSecond = totalMs > 0 ? (totalBytes / totalMs) * MS_IN_SECOND : 0;

  return {
    requested: results.length,
    succeeded: successes.length,
    failed: results.length - successes.length,
    totalBytes,
    averageMs: successes.length > 0 ? totalMs / successes.length : null,
    medianMs: median(durations),
    minMs: reduceOrNull(durations, Math.min),
    maxMs: reduceOrNull(durations, Math.max),
    megabitsPerSecond: (bytesPerSecond * BITS_IN_BYTE) / BYTES_IN_MEGABYTE,
    megabytesPerSecond: bytesPerSecond / BYTES_IN_MEGABYTE,
  };
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function reduceOrNull(values, reducer) {
  return values.length > 0 ? values.reduce((a, b) => reducer(a, b)) : null;
}

function median(values) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}
