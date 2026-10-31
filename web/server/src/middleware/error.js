import multer from 'multer';
import { config } from '../config.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'That endpoint does not exist.' });
}

/** Turns raw Supabase storage errors into something a person can act on. */
export function describeStorageError(message = '') {
  const text = String(message).toLowerCase();
  if (text.includes('bucket not found')) {
    return 'The storage bucket is missing. Restart the server — it creates the bucket on boot.';
  }
  if (text.includes('exceeded the maximum allowed size') || text.includes('payload too large')) {
    return 'That file is larger than the bucket allows.';
  }
  if (text.includes('duplicate') || text.includes('already exists')) {
    return 'A file with that storage key already exists. Try the upload again.';
  }
  if (text.includes('invalid jwt') || text.includes('unauthorized') || text.includes('signature')) {
    return 'Supabase rejected the service key. Check SUPABASE_SERVICE_KEY.';
  }
  return null;
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    const limit = Math.round(config.maxFileBytes / 1024 / 1024);
    const messages = {
      LIMIT_FILE_SIZE: `One of those files is over the ${limit} MB limit.`,
      LIMIT_FILE_COUNT: 'Too many files in one go. Send 30 or fewer.',
      LIMIT_UNEXPECTED_FILE: 'The upload used an unexpected form field.',
      LIMIT_PART_COUNT: 'That upload had too many parts.',
    };
    return res.status(400).json({ error: messages[err.code] || 'That upload could not be read.' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err.message, err.stack ?? '');

  // Server errors used to collapse into one useless sentence. Now the real
  // cause travels with the response so the toast can actually say something.
  res.status(status).json({
    error:
      status >= 500
        ? describeStorageError(err.message) || 'The server could not finish that. Try again.'
        : err.message,
    ...(config.isProd || status < 500 ? {} : { detail: err.message }),
  });
}
