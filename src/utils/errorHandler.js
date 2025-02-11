import { STATUS } from "../constants/statusCodes.js";

const errorHandler = (err, _req, res, _next) => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    res
      .status(err.statusCode || STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: err.message || "Internal Server Error.",
      });
  } else {
    console.error(err);
    res
      .status(err.statusCode || STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: err.message || "Internal Server Error.",
        reason: err.reason || "Reason could not be found.",
        stack: err.stack,
        fileStack: err.stack
          .split("\n")
          .slice(1, 4)
          .map((item) => item.trim()),
      });
  }
};

export { errorHandler };
