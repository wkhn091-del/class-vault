import { Router } from 'express';
import { Readable } from 'node:stream';
import multer from 'multer';
import { config } from '../config.js';
import { supabase, BUCKET } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { buildStoragePath, tidyDisplayName, mapWithLimit } from '../lib/storage.js';
import { resolveContentType } from '../lib/mime.js';
import { describeStorageError } from '../middleware/error.js';
import { badRequest, notFound, wrap, HttpError } from '../lib/errors.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileBytes, files: 30, fields: 20 },
});

/**
 * POST /api/files/folder/:folderId — admin.
 *
 * .any() rather than .array('files') on purpose: a mismatched field name used
 * to surface as an opaque 500. Now anything multipart is accepted and each
 * file is handled independently, so one bad file no longer sinks the batch.
 */
router.post(
  '/folder/:folderId',
  requireAdmin,
  upload.any(),
  wrap(async (req, res) => {
    const { folderId } = req.params;
    const incoming = Array.isArray(req.files) ? req.files : [];
    if (incoming.length === 0) throw badRequest('No files arrived. Pick at least one and try again.');

    const { data: folder, error } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!folder) throw notFound('That folder does not exist.');

    const uploaded = [];
    const failed = [];

    // Three at a time: fast enough to feel instant, bounded enough that a
    // 512 MB instance doesn't fall over on a batch of large PDFs.
    await mapWithLimit(incoming, 3, async (file) => {
      const name = tidyDisplayName(file.originalname);
      const storagePath = buildStoragePath(folderId, name);
      const contentType = resolveContentType(name, file.mimetype);

      try {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file.buffer, { contentType, upsert: false });
        if (uploadError) throw new Error(uploadError.message);

        const { data: row, error: insertError } = await supabase
          .from('files')
          .insert({
            folder_id: folderId,
            name,
            storage_path: storagePath,
            mime_type: contentType,
            size_bytes: file.size,
          })
          .select('id, name, mime_type, size_bytes, created_at')
          .single();

        if (insertError) {
          // Never leave an object in the bucket with no row pointing at it.
          await supabase.storage.from(BUCKET).remove([storagePath]);
          throw new Error(insertError.message);
        }

        uploaded.push(row);
      } catch (err) {
        console.error(`[upload] ${name}: ${err.message}`);
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

/** GET /api/files/:id/link?mode=inline — public. Signed URL, good for 5 minutes. */
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

    const { data, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, 300);
    if (signError) throw new HttpError(500, signError.message);

    res.json({ url: data.signedUrl, name: file.name, mimeType: file.mime_type });
  })
);

/**
 * GET /api/files/:id/raw  and  /api/files/:id/raw/:filename — public.
 *
 * A clean, stable, query-string-free URL that streams the file inline. The
 * Microsoft Office viewer and Google's viewer both fetch the document from
 * their own servers, so they need a plain public URL — a Supabase signed URL
 * carries a ?token= query string and a five-minute clock, which those viewers
 * handle badly. The optional trailing :filename exists only so the URL ends in
 * the right extension, which is how both viewers decide which renderer to use.
 */
const streamRaw = wrap(async (req, res) => {
  const { data: file, error } = await supabase
    .from('files')
    .select('name, storage_path, mime_type, size_bytes')
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!file) throw notFound('That file is no longer here.');

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(file.storage_path, 1800);
  if (signError) throw new HttpError(500, signError.message);

  const upstream = await fetch(data.signedUrl);
  if (!upstream.ok || !upstream.body) throw new HttpError(502, 'Could not read that file from storage.');

  // Uploaded HTML is served as text/plain from this origin. We only ever read
  // it with fetch() and hand it to a sandboxed srcdoc, so nothing is lost — and
  // opening this URL directly can't execute someone's markup on the API origin.
  const type = String(file.mime_type || '');
  const safeType = type.includes('html') ? 'text/plain; charset=utf-8' : type || 'application/octet-stream';

  res.setHeader('Content-Type', safeType);
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=300');
  if (file.size_bytes) res.setHeader('Content-Length', String(file.size_bytes));

  Readable.fromWeb(upstream.body).pipe(res);
});

router.get('/:id/raw', streamRaw);
router.get('/:id/raw/:filename', streamRaw);

/**
 * GET /api/files/:id/download — public.
 *
 * Streamed through the API rather than redirected, so we can set
 * Content-Disposition ourselves. Supabase's ?download= parameter mangles
 * non-ASCII, which meant Hebrew filenames arrived as question marks.
 */
router.get(
  '/:id/download',
  wrap(async (req, res) => {
    const { data: file, error } = await supabase
      .from('files')
      .select('name, storage_path, mime_type, size_bytes')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!file) throw notFound('That file is no longer here.');

    const { data, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, 300);
    if (signError) throw new HttpError(500, signError.message);

    const upstream = await fetch(data.signedUrl);
    if (!upstream.ok || !upstream.body) throw new HttpError(502, 'Could not read that file from storage.');

    // RFC 5987: ASCII fallback plus a UTF-8 encoded real name.
    const ascii = file.name.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file.name)}`
    );
    if (file.size_bytes) res.setHeader('Content-Length', String(file.size_bytes));

    Readable.fromWeb(upstream.body).pipe(res);
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

    await supabase.storage.from(BUCKET).remove([file.storage_path]);

    const { error: deleteError } = await supabase.from('files').delete().eq('id', file.id);
    if (deleteError) throw new HttpError(500, deleteError.message);

    res.status(204).end();
  })
);

export default router;
