#!/usr/bin/env node
import { main } from './src/main.js';

const controller = new AbortController();
process.once('SIGINT', () => controller.abort());

process.exitCode = await main(process.argv.slice(2), { signal: controller.signal });
