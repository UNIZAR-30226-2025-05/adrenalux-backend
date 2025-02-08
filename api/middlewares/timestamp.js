/**
 * Middleware to add a high-precision timestamp to the request headers.
 *
 * This middleware sets the `x-request-time` header in the request with
 * the current high-resolution timestamp (in milliseconds).
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} _res - The Express response object (unused).
 * @param {import('express').NextFunction} next - The next middleware function in the stack.
 */
export function timestamp (req, _res, next) {
    req.headers['x-request-time'] = performance.now().toString()
    next()
  }