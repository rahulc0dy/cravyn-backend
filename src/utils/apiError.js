class ApiError extends Error {
  constructor(statusCode, message, reason) {
    super(message);
    this.statusCode = statusCode;
    this.reason = reason;
  }
}

export default ApiError;
