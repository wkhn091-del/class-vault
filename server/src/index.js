import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { ensureBucket } from './lib/supabase.js';
import authRoutes from './routes/auth.js';
import folderRoutes from './routes/folders.js';
import fileRoutes from './routes/files.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const app = express();

app.set('trust proxy', 1); // Render and Railway sit behind a proxy.
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed.`));
    },
    exposedHeaders: ['Content-Disposition'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.isProd ? 'tiny' : 'dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`Class Vault API listening on http://localhost:${config.port}`);
  ensureBucket();
});

// A batch of 50 MB files over a slow connection needs more than the default.
server.requestTimeout = 10 * 60 * 1000;
server.headersTimeout = 10 * 60 * 1000 + 5000;
