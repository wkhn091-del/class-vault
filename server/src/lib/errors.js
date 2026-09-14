export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg) => new HttpError(400, msg);
export const unauthorized = (msg = 'Enter the admin passcode to do that.') => new HttpError(401, msg);
export const notFound = (msg = 'Not found.') => new HttpError(404, msg);

// Wraps async route handlers so rejected promises reach the error middleware.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
