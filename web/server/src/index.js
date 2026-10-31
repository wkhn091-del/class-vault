import app from './app.js';
import { config } from './config.js';
import { ensureBucket } from './lib/supabase.js';

const server = app.listen(config.port, () => {
  console.log(`Class Vault API listening on http://localhost:${config.port}`);
  ensureBucket();
});

// Local / classic hosts only — Vercel uses serverless export from api/index.js.
server.requestTimeout = 10 * 60 * 1000;
server.headersTimeout = 10 * 60 * 1000 + 5000;
