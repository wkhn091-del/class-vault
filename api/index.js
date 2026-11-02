/**
 * Vercel serverless entry — same Express app as local `server/src/index.js`.
 * File bytes go to Supabase via signed URLs (see files routes), so we stay
 * under Vercel Hobby's 4.5 MB body limit.
 */
export const API_BUILD = '2026-11-02-reorder-files-v3-flat';

import app from '../server/src/app.js';
import '../server/src/lib/folderOrder.js';
import '../server/src/lib/fileOrder.js';
import '../server/src/routes/folders.js';
import '../server/src/routes/files.js';

export default app;
