import 'dotenv/config';
import { createApp } from './app.js';
import { createMySqlRepository, createPoolFromEnv } from './mysqlRepository.js';

const port = Number(process.env.PORT || 3001);
const pool = createPoolFromEnv();
const repository = createMySqlRepository(pool);
const app = createApp({ repository });

app.listen(port, () => {
  console.log(`Security intel API listening on http://localhost:${port}`);
});
