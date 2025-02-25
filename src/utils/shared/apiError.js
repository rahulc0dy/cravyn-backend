/**
 * Custom error class for handling API errors.
 *
 * @class ApiError
 * @extends {Error}
 */
class ApiError extends Error {
  /**
   * Creates an instance of ApiError.
   *
   * @param {number} statusCode - The HTTP status code of the error.
   * @param {string} message - A user-friendly error message.
   * @param {string} [reason] - An optional technical reason for the error.
   */
  constructor(statusCode, message, reason) {
    super(message);
    this.statusCode = statusCode;
    this.reason = reason;
  }
}

export default ApiError;
