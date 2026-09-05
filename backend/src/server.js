import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`\n  Governing Authority Dashboard API`);
  console.log(`  Environment : ${env.nodeEnv}`);
  console.log(`  Listening   : http://localhost:${env.port}`);
  console.log(`  Health      : http://localhost:${env.port}/api/health\n`);
});

function shutdown(signal) {
  console.log(`\n${signal} received. Closing server.`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandled rejection', reason);
  server.close(() => process.exit(1));
});
