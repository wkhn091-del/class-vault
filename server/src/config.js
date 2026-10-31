import 'dotenv/config';

function required(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function buildConfig() {
  return {
    port: Number(process.env.PORT) || 4000,
    isProd: process.env.NODE_ENV === 'production',
    // Same-origin on Vercel needs the real site URL listed (Authorization ≠ *).
    corsOrigins: (
      process.env.CORS_ORIGINS ||
      'http://localhost:5173,https://class-vault-five.vercel.app'
    )
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    adminPasscode: required('ADMIN_PASSCODE'),
    jwtSecret: required('JWT_SECRET'),
    sessionTtl: process.env.SESSION_TTL || '12h',
    supabase: {
      url: required('SUPABASE_URL'),
      serviceKey: required('SUPABASE_SERVICE_KEY'),
      bucket: process.env.SUPABASE_BUCKET || 'vault',
    },
    maxFileBytes: (Number(process.env.MAX_FILE_MB) || 50) * 1024 * 1024,
  };
}

let cached;

/** Lazy so `vercel build` can bundle the function before env vars are read. */
export const config = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!cached) cached = buildConfig();
      return cached[prop];
    },
  }
);
