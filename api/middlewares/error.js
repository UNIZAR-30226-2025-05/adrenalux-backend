import { HttpError, InternalServer } from '../lib/http.js'

/**
 * Global error handler middleware for Express.
 * @param {HttpError | Error} err - The error object thrown by the application
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
export function errorHandler (err, req, res, next) {
  if (err instanceof HttpError) {
    return err.send(req, res)
  }
  const error = new InternalServer()
  return error.send(req, res)
}