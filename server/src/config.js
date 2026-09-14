import 'dotenv/config';

function required(key) {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  isProd: process.env.NODE_ENV === 'production',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
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
