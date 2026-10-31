import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { unauthorized } from '../lib/errors.js';

/** Constant-time comparison so the passcode can't be guessed by timing. */
export function passcodeMatches(input) {
  if (typeof input !== 'string' || input.length === 0) return false;
  const a = crypto.createHash('sha256').update(input).digest();
  const b = crypto.createHash('sha256').update(config.adminPasscode).digest();
  return crypto.timingSafeEqual(a, b);
}

export function issueToken() {
  return jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: config.sessionTtl });
}

export function readToken(req) {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/** Gate for every write route. */
export function requireAdmin(req, _res, next) {
  const token = readToken(req);
  if (!token) return next(unauthorized());
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.role !== 'admin') return next(unauthorized());
    req.admin = true;
    next();
  } catch {
    next(unauthorized('Your admin session expired. Enter the passcode again.'));
  }
}
