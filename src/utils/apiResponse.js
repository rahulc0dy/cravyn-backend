class ApiResponse {
  constructor(data = {}, message = "Success") {
    this.data = data;
    this.message = message;
  }
}

class DevApiResponse extends ApiResponse {
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
