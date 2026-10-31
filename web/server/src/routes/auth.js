import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { issueToken, passcodeMatches, requireAdmin } from '../middleware/auth.js';
import { unauthorized, wrap } from '../lib/errors.js';

const router = Router();

// Ten guesses per 15 minutes per IP. Brute force isn't worth the trouble.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Wait 15 minutes and try again.' },
});

router.post(
  '/unlock',
  loginLimiter,
  wrap(async (req, res) => {
    const { passcode } = req.body ?? {};
    if (!passcodeMatches(passcode)) throw unauthorized('That passcode is not right.');
    res.json({ token: issueToken() });
  })
);

// The frontend calls this on load to see if a stored token is still good.
router.get('/session', requireAdmin, (_req, res) => res.json({ admin: true }));

export default router;
