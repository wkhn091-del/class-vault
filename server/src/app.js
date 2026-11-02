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

app.set('trust proxy', 1);
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
app.use((req, res, next) => {
  // Defer config read so cold imports during `vercel build` don't require secrets.
  const format = process.env.NODE_ENV === 'production' ? 'tiny' : 'dev';
  return morgan(format)(req, res, next);
});

let bucketReady;
app.use((req, res, next) => {
  if (!bucketReady) {
    bucketReady = ensureBucket().catch((err) => {
      console.error('[ensureBucket]', err?.message || err);
    });
  }
  next();
});

app.get('/health', (_req, res) =>
  res.json({ ok: true, apiBuild: '2026-11-02-reorder-files-v3-flat' })
);

app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
