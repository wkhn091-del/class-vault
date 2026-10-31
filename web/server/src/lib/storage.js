import { randomUUID } from 'node:crypto';
import { extensionOf } from './mime.js';

/**
 * Busboy hands back filename bytes decoded as latin1, which turns Hebrew names
 * into mojibake. Re-decoding as UTF-8 repairs them — but only when the name
 * actually came through mangled, otherwise we'd break names that were already
 * correct. The replacement-character check tells the two cases apart.
 */
export function decodeFilename(raw = '') {
  const name = String(raw);
  if (!/[\u0080-\u00ff]/.test(name)) return name.normalize('NFC');

  const repaired = Buffer.from(name, 'latin1').toString('utf8');
  if (repaired.includes('\ufffd')) return name.normalize('NFC');
  return repaired.normalize('NFC');
}

/**
 * The storage key is pure ASCII: <folderId>/<uuid>.<ext>. Hebrew, spaces and
 * slashes in the display name can't affect it, so a name like
 * "סיכום פרק 3.pdf" stores cleanly and still downloads under its real name.
 */
export function buildStoragePath(folderId, displayName) {
  const ext = extensionOf(displayName);
  return ext ? `${folderId}/${randomUUID()}.${ext}` : `${folderId}/${randomUUID()}`;
}

/** Trims a display name to something a database column and a UI row can hold. */
export function tidyDisplayName(name) {
  const cleaned = decodeFilename(name).replace(/[\u0000-\u001f]/g, '').trim();
  if (!cleaned) return 'file';
  return cleaned.length > 160 ? `${cleaned.slice(0, 150)}…${cleaned.slice(-8)}` : cleaned;
}

/** Runs tasks with a cap on how many are in flight at once. */
export async function mapWithLimit(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
