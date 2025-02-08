export class HttpError extends Error {
    /**
     * Base class for HTTP errors.
     * @param {Object} options - The error options.
     * @param {number} [options.httpCode] - The HTTP status code.
     * @param {number} [options.appErrorCode] - The custom application error code.
     * @param {string} [options.message] - The error message.
     */
    constructor ({ httpCode = 500, appErrorCode = 1000, message = 'Internal Server Error' } = {}) {
      super(message)
      this.httpCode = httpCode
      this.appErrorCode = appErrorCode
      Error.captureStackTrace(this, this.constructor)
    }
  
    /**
     * Creates an error response with a specific HTTP status.
     * @param {Object} options - The error options.
     * @param {number} [options.httpCode] - The HTTP status code.
     * @param {number} [options.appErrorCode] - The custom application error code.
     * @param {string} [options.defaultMessage] - Default error message if none is provided.
     * @returns {typeof HttpError} A subclass of HttpError with static properties.
     */
    static create ({ httpCode = 500, appErrorCode = 1000, defaultMessage = 'Internal Server Error' } = {}) {
      const Subclass = class extends HttpError {
        constructor ({ message } = {}) {
          super({ httpCode, appErrorCode, message: message || defaultMessage })
        }
      }
  
      // Assign static properties to allow access like `Success.httpCode`
      Subclass.httpCode = httpCode
      Subclass.appErrorCode = appErrorCode
      Subclass.message = defaultMessage
  
      return Subclass
    }
  
    send (req, res, options = {}) {
      sendResponse(req, res, {
        status: {
          httpCode: options.status?.httpCode ?? this.httpCode,
          errorCode: options.status?.errorCode ?? this.appErrorCode,
          errorMessage: options.status?.message ?? this.message
        }
      })
    }
  }
  
  // Define common HTTP errors with separate HTTP and application error codes
  export const BadRequest = HttpError.create({ httpCode: 400, appErrorCode: 1000, defaultMessage: 'Bad Request' })
  export const Unauthorized = HttpError.create({ httpCode: 401, appErrorCode: 1000, defaultMessage: 'Unauthorized' })
  export const NotFound = HttpError.create({ httpCode: 404, appErrorCode: 1000, defaultMessage: 'Not Found' })
  export const Conflict = HttpError.create({ httpCode: 409, appErrorCode: 1000, defaultMessage: 'Conflict' })
  export const TooManyRequests = HttpError.create({ httpCode: 429, appErrorCode: 1000, defaultMessage: 'Too Many Requests' })
  export const InternalServer = HttpError.create({ httpCode: 500, appErrorCode: 1000, defaultMessage: 'Internal Server Error' })
  
  /**
   * Sends a standardized JSON response in an API.
   *
   * @param {import('express').Request} req - The Express request object.
   * @param {import('express').Response} res - The Express response object.
   * @param {Object} [options={}] - The response payload.
   * @param {Object} [options.meta] - Pagination metadata (if applicable).
   * @param {number} options.meta.currentPage - The current page index.
   * @param {string|null} options.meta.previousPage - The URI for the previous page, or `null` if there is no previous page.
   * @param {string|null} options.meta.nextPage - The URI for the next page, or `null` if there is no next page.
   * @param {number} options.meta.pages - Total number of pages available.
   * @param {number} options.meta.perPage - Number of items per page.
   * @param {number} options.meta.totalItems - Total number of items in the dataset.
   * @param {Array|Object} [options.data] - The actual response data, can be an object or an array.
   * @param {Object} [options.status] - Status information including error codes and timestamps.
   * @param {number} [options.status.httpCode=200] - The HTTP status code of the response.
   * @param {number} [options.status.errorCode=0] - The application-specific error code (0 means no error).
   * @param {string} [options.status.errorMessage='An error occurred'] - The error message if applicable.
   *
   * @returns {{
  *   meta?: {
    *     currentPage: number,
    *     previousPage: string | null,
    *     nextPage: string | null,
    *     pages: number,
    *     perPage: number,
    *     totalItems: number
    *   },
    *   data?: Array|Object,
    *   status: {
    *     timestamp: string,
    *     error_code: number,
    *     error_message: string,
    *     elapsed: number
    *   }
    * }}
    */
  export function sendResponse (req, res, { meta, data, status } = {}) {
    const hasData = Boolean(data && (Array.isArray(data) ? data.length : true))
    const hasMeta = Boolean(meta && hasData && Array.isArray(data))
  
    const { httpCode = 200, errorCode = 0, errorMessage = '' } = status || {}
  
    return res
      .status(httpCode)
      .send({
        ...(hasMeta && { meta }),
        ...(hasData && { data }),
        status: {
          timestamp: new Date().toISOString(),
          error_code: errorCode,
          error_message: errorMessage,
          elapsed: Math.floor(performance.now() - Number(req.headers['x-request-time']))
        }
      })
  }