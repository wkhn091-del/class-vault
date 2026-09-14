import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Service-role client: full access, server-side only.
export const supabase = createClient(config.supabase.url, config.supabase.serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const BUCKET = config.supabase.bucket;

/**
 * "Bucket not found" was the single most common cause of a failed upload:
 * the SQL insert into storage.buckets is easy to miss. Check on boot and
 * create it if it isn't there, so setup can't half-happen.
 */
export async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (data && !error) {
    console.log(`Storage bucket "${BUCKET}" is ready.`);
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: config.maxFileBytes,
  });

  if (createError) {
    console.error(
      `Could not open or create the storage bucket "${BUCKET}": ${createError.message}\n` +
        'Check SUPABASE_URL and that SUPABASE_SERVICE_KEY is the service_role key, not the anon key.'
    );
    return;
  }
  console.log(`Created private storage bucket "${BUCKET}".`);
}
