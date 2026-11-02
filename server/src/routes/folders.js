import { Router } from 'express';
import { supabase, getBucket } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { badRequest, notFound, wrap, HttpError } from '../lib/errors.js';
import {
  appendFolderOrder,
  readFolderOrder,
  removeFolderOrder,
  sortFoldersByOrder,
  writeFolderOrder,
} from '../lib/folderOrder.js';
import {
  clearFileOrder,
  readFileOrder,
  sortFilesByOrder,
  writeFileOrder,
} from '../lib/fileOrder.js';

const router = Router();

const COLUMNS = 'id, name, description, is_pinned, color, created_at';
const HEX = /^#[0-9a-fA-F]{6}$/;

function readColor(value) {
  if (value === null || value === '') return null;
  const color = String(value).trim();
  if (!HEX.test(color)) throw badRequest('Colour must be a six-digit hex value, like #A97C25.');
  return color.toLowerCase();
}

async function withStats(folders) {
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

  return folders.map((folder, index) => ({
    ...folder,
    sort_order: index,
    ...(stats.get(folder.id) ?? { fileCount: 0, totalBytes: 0, updatedAt: null }),
  }));
}

/** GET /api/folders — public. Manual order when set; otherwise pin + name. */
router.get(
  '/',
  wrap(async (_req, res) => {
    const { data: folders, error } = await supabase.from('folders').select(COLUMNS);
    if (error) throw new HttpError(500, error.message);

    const order = await readFolderOrder();
    const sorted = sortFoldersByOrder(folders, order);
    res.json(await withStats(sorted));
  })
);

/**
 * PUT /api/folders/reorder — admin.
 * Body: { ids: string[] } full ordered list of folder ids.
 * Must be registered before /:id routes.
 */
router.put(
  '/reorder',
  requireAdmin,
  wrap(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : null;
    if (!ids?.length) throw badRequest('Send the full folder order as ids.');

    const { data: folders, error } = await supabase.from('folders').select('id');
    if (error) throw new HttpError(500, error.message);

    const existing = new Set(folders.map((f) => String(f.id)));
    const unique = [];
    const seen = new Set();
    for (const id of ids) {
      if (!existing.has(id) || seen.has(id)) continue;
      seen.add(id);
      unique.push(id);
    }
    // Append any folders the client omitted so nothing disappears from order.
    for (const id of existing) {
      if (!seen.has(id)) unique.push(id);
    }

    await writeFolderOrder(unique);

    const { data: all, error: listError } = await supabase.from('folders').select(COLUMNS);
    if (listError) throw new HttpError(500, listError.message);
    res.json(await withStats(sortFoldersByOrder(all, unique)));
  })
);

/**
 * PUT /api/folders/reorder-files — admin.
 * Body: { folderId: string, ids: string[] }
 * Flat path (same style as /reorder) — nested /:id/... routes 404 on Vercel rewrite.
 */
router.put(
  '/reorder-files',
  requireAdmin,
  wrap(async (req, res) => {
    const folderId = String(req.body?.folderId || '').trim();
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : null;
    if (!folderId) throw badRequest('Missing folderId.');
    if (!ids?.length) throw badRequest('Send the full file order as ids.');

    const { data: folder, error } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!folder) throw notFound('That folder does not exist.');

    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, name, mime_type, size_bytes, created_at')
      .eq('folder_id', folderId);
    if (filesError) throw new HttpError(500, filesError.message);

    const existing = new Set(files.map((f) => String(f.id)));
    const unique = [];
    const seen = new Set();
    for (const id of ids) {
      if (!existing.has(id) || seen.has(id)) continue;
      seen.add(id);
      unique.push(id);
    }
    for (const id of existing) {
      if (!seen.has(id)) unique.push(id);
    }

    await writeFileOrder(folderId, unique);
    res.json(sortFilesByOrder(files, unique));
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
      .eq('folder_id', folder.id);
    if (filesError) throw new HttpError(500, filesError.message);

    const fileOrder = await readFileOrder(folder.id);
    res.json({ ...folder, files: sortFilesByOrder(files, fileOrder) });
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

    try {
      await appendFolderOrder(data.id);
    } catch (err) {
      console.warn('Could not append folder order:', err.message || err);
    }

    res.status(201).json({ ...data, fileCount: 0, totalBytes: 0, updatedAt: null, sort_order: 9999 });
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
      await supabase.storage.from(getBucket()).remove(files.map((f) => f.storage_path));
    }

    const { error: deleteError } = await supabase.from('folders').delete().eq('id', req.params.id);
    if (deleteError) throw new HttpError(500, deleteError.message);

    try {
      await removeFolderOrder(req.params.id);
    } catch (err) {
      console.warn('Could not update folder order after delete:', err.message || err);
    }
    try {
      await clearFileOrder(req.params.id);
    } catch (err) {
      console.warn('Could not clear file order after folder delete:', err.message || err);
    }

    res.status(204).end();
  })
);

export default router;
