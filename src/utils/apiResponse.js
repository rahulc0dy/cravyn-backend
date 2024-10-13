/**
 * Class representing a standardized API response.
 *
 * This class constructs a response object that is returned from API endpoints,
 * encapsulating the status code, data, message, and success status.
 *
 * @class ApiResponse
 *
 * @param {number} statusCode - The HTTP status code of the response.
 * @param {Object} data - The data to be included in the response.
 * @param {string} [message="Success"] - A message describing the result of the request.
 *
 * @property {number} statusCode - The HTTP status code of the response.
 * @property {Object} data - The data returned in the response.
 * @property {string} message - A message describing the result of the request.
 * @property {boolean} success - Indicates whether the request was successful (statusCode < 400).
 */
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
