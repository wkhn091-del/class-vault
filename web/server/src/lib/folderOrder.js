import { getBucket, getSupabase } from './supabase.js';

const ORDER_PATH = '_meta/folder-order.json';

/**
 * Manual folder order lives in a small JSON object in Storage so we can
 * reorder without a DB migration. Missing file = fall back to pin + name.
 */
export async function readFolderOrder() {
  const { data, error } = await getSupabase().storage.from(getBucket()).download(ORDER_PATH);
  if (error || !data) return [];
  try {
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed?.ids) ? parsed.ids.map(String) : [];
  } catch {
    return [];
  }
}

export async function writeFolderOrder(ids) {
  const body = JSON.stringify({
    ids: ids.map(String),
    updatedAt: new Date().toISOString(),
  });
  const { error } = await getSupabase().storage.from(getBucket()).upload(ORDER_PATH, body, {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) throw error;
}

/** Pin + name — used when no manual order has been saved yet. */
export function defaultFolderSort(a, b) {
  return (
    Number(b.is_pinned) - Number(a.is_pinned) ||
    String(a.name).localeCompare(String(b.name), 'he')
  );
}

export function sortFoldersByOrder(folders, ids) {
  if (!ids?.length) return [...folders].sort(defaultFolderSort);
  const rank = new Map(ids.map((id, i) => [String(id), i]));
  return [...folders].sort((a, b) => {
    const ra = rank.has(String(a.id)) ? rank.get(String(a.id)) : Number.MAX_SAFE_INTEGER;
    const rb = rank.has(String(b.id)) ? rank.get(String(b.id)) : Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return defaultFolderSort(a, b);
  });
}

/** Keep the order file in sync when folders are added or removed. */
export async function appendFolderOrder(id) {
  const ids = await readFolderOrder();
  if (!ids.length) return; // still on default sort until teacher reorders once
  if (ids.includes(String(id))) return;
  await writeFolderOrder([...ids, String(id)]);
}

export async function removeFolderOrder(id) {
  const ids = await readFolderOrder();
  if (!ids.length) return;
  const next = ids.filter((x) => x !== String(id));
  if (next.length === ids.length) return;
  await writeFolderOrder(next);
}
