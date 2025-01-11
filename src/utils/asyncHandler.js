const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error.",
    reason:
      process.env.NODE_ENV === "production"
        ? null
        : err.reason || "Reason could not be found",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
    fileStack:
      process.env.NODE_ENV === "production"
        ? null
        : err.stack
            .split("\n")
            .slice(1, 4)
            .map((item) => item.trim()),
  });
};

export { asyncHandler, errorHandler };
