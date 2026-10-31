import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let client;

/** Service-role client: full access, server-side only. */
export function getSupabase() {
  if (!client) {
    client = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** @deprecated Prefer getSupabase() — kept as a lazy proxy for existing imports. */
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const value = getSupabase()[prop];
      return typeof value === 'function' ? value.bind(getSupabase()) : value;
    },
  }
);

export function getBucket() {
  return config.supabase.bucket;
}

/** String bucket name, resolved on each read so env can stay lazy. */
export const BUCKET = {
  toString() {
    return getBucket();
  },
  valueOf() {
    return getBucket();
  },
  [Symbol.toPrimitive]() {
    return getBucket();
  },
};

/**
 * "Bucket not found" was the single most common cause of a failed upload.
 * Check on boot / first request and create it if it isn't there.
 */
export async function ensureBucket() {
  const bucket = getBucket();
  const { data, error } = await getSupabase().storage.getBucket(bucket);
  if (data && !error) {
    console.log(`Storage bucket "${bucket}" is ready.`);
    return;
  }

  const { error: createError } = await getSupabase().storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: config.maxFileBytes,
  });

  if (createError) {
    console.error(
      `Could not open or create the storage bucket "${bucket}": ${createError.message}\n` +
        'Check SUPABASE_URL and that SUPABASE_SERVICE_KEY is the service_role key, not the anon key.'
    );
    return;
  }
  console.log(`Created private storage bucket "${bucket}".`);
}
