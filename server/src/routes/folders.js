import { Router } from 'express';
import { supabase, BUCKET } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { badRequest, notFound, wrap, HttpError } from '../lib/errors.js';

const router = Router();

const COLUMNS = 'id, name, description, is_pinned, color, created_at';
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Pinned first, then alphabetical — matches the index on the table. */
function applyOrder(query) {
  return query.order('is_pinned', { ascending: false }).order('name', { ascending: true });
}

function readColor(value) {
  if (value === null || value === '') return null;
  const color = String(value).trim();
  if (!HEX.test(color)) throw badRequest('Colour must be a six-digit hex value, like #A97C25.');
  return color.toLowerCase();
}

/** GET /api/folders — public. */
router.get(
  '/',
  wrap(async (_req, res) => {
    const { data: folders, error } = await applyOrder(supabase.from('folders').select(COLUMNS));
    if (error) throw new HttpError(500, error.message);

    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('folder_id, size_bytes, created_at');
    if (filesError) throw new HttpError(500, filesError.message);

    const stats = new Map();
    for (const f of files) {
      const s = stats.get(f.folder_id) ?? { fileCount: 0, totalBytes: 0, updatedAt: null };
      s.fileCount += 1;
      s.totalBytes += Number(f.size_bytes) || 0;
      if (!s.updatedAt || f.created_at > s.updatedAt) s.updatedAt = f.created_at;
      stats.set(f.folder_id, s);
    }

    res.json(
      folders.map((folder) => ({
        ...folder,
        ...(stats.get(folder.id) ?? { fileCount: 0, totalBytes: 0, updatedAt: null }),
      }))
    );
  })
);

/** GET /api/folders/:id — public. */
router.get(
  '/:id',
  wrap(async (req, res) => {
    const { data: folder, error } = await supabase
      .from('folders')
      .select(COLUMNS)
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!folder) throw notFound('That folder does not exist.');

    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, name, mime_type, size_bytes, created_at')
      .eq('folder_id', folder.id)
      .order('created_at', { ascending: false });
    if (filesError) throw new HttpError(500, filesError.message);

    res.json({ ...folder, files });
  })
);

/** POST /api/folders — admin. */
router.post(
  '/',
  requireAdmin,
  wrap(async (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    if (!name) throw badRequest('Give the folder a name.');
    if (name.length > 80) throw badRequest('Keep folder names under 80 characters.');

    const insert = {
      name,
      description: String(req.body?.description ?? '').trim() || null,
      is_pinned: Boolean(req.body?.is_pinned),
      color: req.body?.color === undefined ? null : readColor(req.body.color),
    };

    const { data, error } = await supabase.from('folders').insert(insert).select(COLUMNS).single();
    if (error?.code === '23505') throw badRequest('A folder with that name already exists.');
    if (error) throw new HttpError(500, error.message);

    res.status(201).json({ ...data, fileCount: 0, totalBytes: 0, updatedAt: null });
  })
);

/**
 * PATCH /api/folders/:id — admin.
 * Handles rename, description, pinning and colour, together or one at a time.
 */
router.patch(
  '/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const patch = {};

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) throw badRequest('Give the folder a name.');
      if (name.length > 80) throw badRequest('Keep folder names under 80 characters.');
      patch.name = name;
    }
    if (req.body?.description !== undefined) {
      patch.description = String(req.body.description).trim() || null;
    }
    if (req.body?.is_pinned !== undefined) {
      patch.is_pinned = Boolean(req.body.is_pinned);
    }
    if (req.body?.color !== undefined) {
      patch.color = readColor(req.body.color);
    }

    if (Object.keys(patch).length === 0) throw badRequest('Nothing to update.');

    const { data, error } = await supabase
      .from('folders')
      .update(patch)
      .eq('id', req.params.id)
      .select(COLUMNS)
      .maybeSingle();

    if (error?.code === '23505') throw badRequest('A folder with that name already exists.');
    if (error?.code === '23514') throw badRequest('Colour must be a six-digit hex value, like #A97C25.');
    if (error) throw new HttpError(500, error.message);
    if (!data) throw notFound('That folder does not exist.');

    res.json(data);
  })
);

/** DELETE /api/folders/:id — admin. Removes the stored files too. */
router.delete(
  '/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const { data: files, error } = await supabase
      .from('files')
      .select('storage_path')
      .eq('folder_id', req.params.id);
    if (error) throw new HttpError(500, error.message);

    if (files.length > 0) {
      await supabase.storage.from(BUCKET).remove(files.map((f) => f.storage_path));
    }

    const { error: deleteError } = await supabase.from('folders').delete().eq('id', req.params.id);
    if (deleteError) throw new HttpError(500, deleteError.message);

    res.status(204).end();
  })
);

export default router;
