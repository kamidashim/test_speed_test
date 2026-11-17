export class HttpError extends Error {
  constructor(status, statusText) {
    super(`HTTP ${status}${statusText ? ` ${statusText}` : ''}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function download(url, { timeoutMs, signal } = {}) {
  const startedAt = performance.now();

  const response = await fetch(url, {
    signal: buildSignal(timeoutMs, signal),
    headers: { 'Cache-Control': 'no-cache' },
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new HttpError(response.status, response.statusText);
  }

  let bytes = 0;

  for await (const chunk of response.body ?? []) {
    bytes += chunk.byteLength;
  }

  return { bytes, durationMs: performance.now() - startedAt };
}

export function describeError(error) {
  if (error instanceof HttpError) {
    return error.message;
  }

  if (error?.name === 'TimeoutError') {
    return 'превышено время ожидания';
  }

  if (error?.name === 'AbortError') {
    return 'запрос прерван';
  }

  const code = error?.cause?.code;

  if (code) {
    return `сетевая ошибка (${code})`;
  }

  return error?.message ?? String(error);
}

function buildSignal(timeoutMs, signal) {
  const signals = [];

  if (timeoutMs !== undefined) {
    signals.push(AbortSignal.timeout(timeoutMs));
  }

  if (signal) {
    signals.push(signal);
  }

  return signals.length > 0 ? AbortSignal.any(signals) : undefined;
}
