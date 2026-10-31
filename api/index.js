/**
 * Vercel serverless entry — same Express app as local `server/src/index.js`.
 * File bytes go to Supabase via signed URLs (see files routes), so we stay
 * under Vercel Hobby's 4.5 MB body limit.
 */
import app from '../server/src/app.js';

export default app;
