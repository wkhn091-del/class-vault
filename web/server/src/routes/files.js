import { Router } from 'express';
import { config } from '../config.js';
import { supabase, getBucket } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { buildStoragePath, tidyDisplayName, mapWithLimit } from '../lib/storage.js';
import { resolveContentType } from '../lib/mime.js';
import { describeStorageError } from '../middleware/error.js';
import { badRequest, notFound, wrap, HttpError } from '../lib/errors.js';

const router = Router();

/**
 * POST /api/files/folder/:folderId/sign — admin.
 * Returns short-lived Supabase upload URLs so the browser puts bytes straight
 * into Storage (works on Vercel Hobby; avoids the 4.5 MB body cap).
 */
router.post(
  '/folder/:folderId/sign',
  requireAdmin,
  wrap(async (req, res) => {
    const { folderId } = req.params;
    const incoming = Array.isArray(req.body?.files) ? req.body.files : [];
    if (incoming.length === 0) throw badRequest('No files arrived. Pick at least one and try again.');
    if (incoming.length > 30) throw badRequest('Upload at most 30 files at a time.');

    const { data: folder, error } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!folder) throw notFound('That folder does not exist.');

    const uploads = [];
    const failed = [];

    for (let index = 0; index < incoming.length; index += 1) {
      const item = incoming[index];
      const name = tidyDisplayName(item?.name);
      const size = Number(item?.size) || 0;
      const contentType = resolveContentType(name, item?.type || item?.mimeType || '');

      if (!name || name === 'file') {
        failed.push({ index, name: String(item?.name || 'file'), reason: 'Give the file a name.' });
        continue;
      }
      if (size <= 0) {
        failed.push({ index, name, reason: 'Empty file.' });
        continue;
      }
      if (size > config.maxFileBytes) {
        failed.push({
          index,
          name,
          reason: `File is over the ${Math.round(config.maxFileBytes / (1024 * 1024))} MB limit.`,
        });
        continue;
      }

      const storagePath = buildStoragePath(folderId, name);
      const { data, error: signError } = await supabase.storage
        .from(getBucket())
        .createSignedUploadUrl(storagePath);

      if (signError || !data?.signedUrl) {
        failed.push({
          index,
          name,
          reason: describeStorageError(signError?.message) || signError?.message || 'Could not sign upload.',
        });
        continue;
      }

      uploads.push({
        index,
        name,
        storagePath,
        signedUrl: data.signedUrl,
        token: data.token,
        contentType,
        size,
      });
    }

    if (uploads.length === 0) {
      throw new HttpError(502, failed[0]?.reason || 'None of those files could be prepared.');
    }

    res.json({ uploads, failed });
  })
);

/**
 * POST /api/files/folder/:folderId/complete — admin.
 * After the browser finishes PUTting to Supabase, record the rows.
 */
router.post(
  '/folder/:folderId/complete',
  requireAdmin,
  wrap(async (req, res) => {
    const { folderId } = req.params;
    const incoming = Array.isArray(req.body?.files) ? req.body.files : [];
    if (incoming.length === 0) throw badRequest('Nothing to complete.');

    const { data: folder, error } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!folder) throw notFound('That folder does not exist.');

    const uploaded = [];
    const failed = [];

    await mapWithLimit(incoming, 5, async (item) => {
      const name = tidyDisplayName(item?.name);
      const storagePath = String(item?.storagePath || '');
      const contentType = resolveContentType(name, item?.contentType || item?.mimeType || '');
      const size = Number(item?.size) || 0;

      if (!storagePath.startsWith(`${folderId}/`)) {
        failed.push({ name, reason: 'Invalid storage path.' });
        return;
      }

      try {
        const { data: row, error: insertError } = await supabase
          .from('files')
          .insert({
            folder_id: folderId,
            name,
            storage_path: storagePath,
            mime_type: contentType,
            size_bytes: size,
          })
          .select('id, name, mime_type, size_bytes, created_at')
          .single();

        if (insertError) {
          await supabase.storage.from(getBucket()).remove([storagePath]);
          throw new Error(insertError.message);
        }

        uploaded.push(row);
      } catch (err) {
        console.error(`[complete] ${name}: ${err.message}`);
        failed.push({ name, reason: describeStorageError(err.message) || err.message });
      }
    });

    if (uploaded.length === 0) {
      throw new HttpError(502, failed[0]?.reason || 'None of those files could be stored.');
    }

    uploaded.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    res.status(201).json({ uploaded, failed });
  })
);

/** GET /api/files/:id/link?download=1 — public. Signed URL, good for 5 minutes. */
router.get(
  '/:id/link',
  wrap(async (req, res) => {
    const { data: file, error } = await supabase
      .from('files')
      .select('id, name, storage_path, mime_type')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!file) throw notFound('That file is no longer here.');

    const forceDownload =
      req.query.download === '1' ||
      req.query.download === 'true' ||
      req.query.mode === 'download';
    const signOpts = forceDownload ? { download: file.name } : undefined;

    const { data, error: signError } = await supabase.storage
      .from(getBucket())
      .createSignedUrl(file.storage_path, 300, signOpts);
    if (signError) throw new HttpError(500, signError.message);

    res.json({ url: data.signedUrl, name: file.name, mimeType: file.mime_type });
  })
);

/**
 * GET /api/files/:id/raw[/:filename] — public.
 * 302 to a Supabase signed URL (no streaming through Vercel — body-size safe).
 * Office/Google viewers hit this stable extension URL; they follow the redirect.
 */
const redirectRaw = wrap(async (req, res) => {
  const { data: file, error } = await supabase
    .from('files')
    .select('name, storage_path, mime_type')
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!file) throw notFound('That file is no longer here.');

  const { data, error: signError } = await supabase.storage
    .from(getBucket())
    .createSignedUrl(file.storage_path, 1800);
  if (signError) throw new HttpError(500, signError.message);

  res.redirect(302, data.signedUrl);
});

router.get('/:id/raw', redirectRaw);
router.get('/:id/raw/:filename', redirectRaw);

/**
 * GET /api/files/:id/download — public.
 * Redirect to a signed URL that forces download with the real (incl. Hebrew) name.
 */
router.get(
  '/:id/download',
  wrap(async (req, res) => {
    const { data: file, error } = await supabase
      .from('files')
      .select('name, storage_path')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!file) throw notFound('That file is no longer here.');

    const { data, error: signError } = await supabase.storage
      .from(getBucket())
      .createSignedUrl(file.storage_path, 300, { download: file.name });
    if (signError) throw new HttpError(500, signError.message);

    res.redirect(302, data.signedUrl);
  })
);

/** PATCH /api/files/:id — admin. Rename. */
router.patch(
  '/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const name = tidyDisplayName(String(req.body?.name ?? ''));
    if (!name || name === 'file') throw badRequest('Give the file a name.');

    const { data, error } = await supabase
      .from('files')
      .update({ name })
      .eq('id', req.params.id)
      .select('id, name, mime_type, size_bytes, created_at')
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!data) throw notFound('That file is no longer here.');

    res.json(data);
  })
);

/** DELETE /api/files/:id — admin. */
router.delete(
  '/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const { data: file, error } = await supabase
      .from('files')
      .select('id, storage_path')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!file) throw notFound('That file is no longer here.');

    await supabase.storage.from(getBucket()).remove([file.storage_path]);

    const { error: deleteError } = await supabase.from('files').delete().eq('id', file.id);
    if (deleteError) throw new HttpError(500, deleteError.message);

    res.status(204).end();
  })
);

export default router;
