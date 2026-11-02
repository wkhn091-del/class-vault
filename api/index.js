/**
 * Vercel serverless entry — same Express app as local `server/src/index.js`.
 * File bytes go to Supabase via signed URLs (see files routes), so we stay
 * under Vercel Hobby's 4.5 MB body limit.
 *
 * Bump API_BUILD whenever server routes change so Vercel rebundles includes.
 */
export const API_BUILD = '2026-11-02-reorder-files-v2';

import app from '../server/src/app.js';
// Keep order helpers in the NFT graph explicitly (includeFiles alone can go stale).
import '../server/src/lib/folderOrder.js';
import '../server/src/lib/fileOrder.js';

export default app;
