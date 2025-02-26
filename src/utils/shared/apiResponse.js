/**
 * Standard API response class.
 *
 * @class ApiResponse
 */
class ApiResponse {
  /**
   * Creates an instance of ApiResponse.
   *
   * @param {Object} [data={}] - The response data.
   * @param {string} [message="Success"] - A message describing the response.
   */
  constructor(data = {}, message = "Success") {
    this.data = data;
    this.message = message;
  }
}

/**
 * Extended API response class for development/debugging.
 *
 * @class DevApiResponse
 * @extends {ApiResponse}
 */
class DevApiResponse extends ApiResponse {
  /**
   * Creates an instance of DevApiResponse.
   *
   * @param {Object} [data={}] - The response data.
   * @param {string} [message="Success"] - A message describing the response.
   * @param {string} [reason="Reason could not be found."] - The reason for the response.
   * @param {Array<string>} [fileStackTrace=[]] - Stack trace information for debugging.
   */
  constructor(
    data = {},
    message = "Success",
    reason = "Reason could not be found.",
    fileStackTrace = []
  ) {
    super(data, message);
    this.reason = reason;
    this.fileStackTrace = fileStackTrace;
  }
}

export { ApiResponse, DevApiResponse };
