import { buildApp } from './app.js';

const port = Number(process.env['API_PORT']) || 4000;
const host = process.env['API_HOST'] || '0.0.0.0';

const server = buildApp();

server.listen({ port, host }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`AlgoReflex API server listening on ${address}`);
});
