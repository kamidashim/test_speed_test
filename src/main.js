import { USAGE, UsageError, parseCli } from './args.js';
import { download } from './download.js';
import { formatHeader, formatJson, formatRequestLine, formatSummary } from './report.js';
import { runSequential } from './runner.js';
import { summarize } from './stats.js';

export const ExitCode = Object.freeze({
  OK: 0,
  FAILED: 1,
  USAGE: 2,
  INTERRUPTED: 130,
});

export async function main(
  argv,
  { stdout = process.stdout, stderr = process.stderr, signal } = {},
) {
  let options;

  try {
    options = parseCli(argv);
  } catch (error) {
    if (!(error instanceof UsageError)) {
      throw error;
    }

    stderr.write(`Ошибка: ${error.message}\n\n${USAGE}\n`);
    return ExitCode.USAGE;
  }

  if (options.help) {
    stdout.write(`${USAGE}\n`);
    return ExitCode.OK;
  }

  const { url, count, timeoutMs, json } = options;

  if (!json) {
    stdout.write(`${formatHeader({ url, count })}\n`);
  }

  const results = await runSequential(count, () => download(url, { timeoutMs, signal }), {
    signal,
    onResult: json
      ? undefined
      : (index, result) => stdout.write(`${formatRequestLine(index, count, result)}\n`),
  });

  if (signal?.aborted) {
    return ExitCode.INTERRUPTED;
  }

  const summary = summarize(results);

  stdout.write(json ? `${formatJson({ url, results, summary })}\n` : `\n${formatSummary(summary)}\n`);

  return summary.failed === 0 ? ExitCode.OK : ExitCode.FAILED;
}
