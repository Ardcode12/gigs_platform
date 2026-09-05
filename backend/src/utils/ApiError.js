/**
 * Error type carrying an HTTP status. Anything thrown that is not an ApiError
 * is treated as an unexpected 500 by the error handler.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Authentication required.') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have access to this resource.') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found.') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static tooManyRequests(message) {
    return new ApiError(429, message);
  }

  static internal(message = 'Something went wrong. Please try again.') {
    return new ApiError(500, message);
  }
}
