export async function runSequential(count, task, { signal, onResult } = {}) {
  const results = [];

  for (let index = 1; index <= count && !signal?.aborted; index += 1) {
    const result = await attempt(task);
    results.push(result);
    onResult?.(index, result);
  }

  return results;
}

async function attempt(task) {
  try {
    const { bytes, durationMs } = await task();
    return { ok: true, bytes, durationMs };
  } catch (error) {
    return { ok: false, error };
  }
}
