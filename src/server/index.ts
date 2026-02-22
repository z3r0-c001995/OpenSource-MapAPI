import { env } from '../config/env.js';
import { buildApp } from './app.js';

const app = buildApp();

app
  .listen({ port: env.PORT, host: '0.0.0.0' })
  .then(() => app.log.info(`MapAPI listening on :${env.PORT}`))
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
