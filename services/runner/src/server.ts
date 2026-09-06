import { buildRunnerApp } from './app.js';

const port = Number(process.env['RUNNER_PORT']) || 4050;
const host = process.env['RUNNER_HOST'] || '127.0.0.1';
const app = buildRunnerApp();

void app.listen({ port, host }).catch(error => {
  app.log.error(error);
  process.exit(1);
});
