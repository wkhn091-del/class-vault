import { getBucket, getSupabase } from './supabase.js';

const orderPath = (folderId) => `_meta/file-order/${folderId}.json`;

/** Newest first — default until the teacher saves a manual order. */
export function defaultFileSort(a, b) {
  return String(b.created_at || '').localeCompare(String(a.created_at || ''));
}

export async function readFileOrder(folderId) {
  const { data, error } = await getSupabase().storage.from(getBucket()).download(orderPath(folderId));
  if (error || !data) return [];
  try {
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed?.ids) ? parsed.ids.map(String) : [];
  } catch {
    return [];
  }
}

export async function writeFileOrder(folderId, ids) {
  const body = JSON.stringify({
    ids: ids.map(String),
    updatedAt: new Date().toISOString(),
  });
  const { error } = await getSupabase().storage.from(getBucket()).upload(orderPath(folderId), body, {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) throw error;
}

export function sortFilesByOrder(files, ids) {
  if (!ids?.length) return [...files].sort(defaultFileSort);
  const rank = new Map(ids.map((id, i) => [String(id), i]));
  return [...files].sort((a, b) => {
    const ra = rank.has(String(a.id)) ? rank.get(String(a.id)) : Number.MAX_SAFE_INTEGER;
    const rb = rank.has(String(b.id)) ? rank.get(String(b.id)) : Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return defaultFileSort(a, b);
  });
}

/** Prepend newly uploaded files when a manual order already exists. */
export async function prependFileOrder(folderId, newIds) {
  const ids = await readFileOrder(folderId);
  if (!ids.length) return;
  const incoming = newIds.map(String).filter((id) => !ids.includes(id));
  if (!incoming.length) return;
  await writeFileOrder(folderId, [...incoming, ...ids]);
}

export async function removeFileOrder(folderId, fileId) {
  const ids = await readFileOrder(folderId);
  if (!ids.length) return;
  const next = ids.filter((x) => x !== String(fileId));
  if (next.length === ids.length) return;
  await writeFileOrder(folderId, next);
}

export async function clearFileOrder(folderId) {
  await getSupabase().storage.from(getBucket()).remove([orderPath(folderId)]);
}
