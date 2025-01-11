const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error.",
    reason: isProduction ? null : err.reason || "Reason could not be found",
    stack: isProduction ? null : err.stack,
    fileStack: isProduction
      ? null
      : err.stack
          .split("\n")
          .slice(1, 4)
          .map((item) => item.trim()),
  });
};

export { errorHandler };
