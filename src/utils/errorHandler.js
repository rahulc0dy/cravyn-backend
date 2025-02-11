import { STATUS } from "../constants/statusCodes.js";
import { ZodError } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const errorHandler = (err, _req, res, _next) => {
  const statusCode =
    err.statusCode || STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal Server Error.";

  if (err instanceof ZodError) {
    res.status(STATUS.CLIENT_ERROR.BAD_REQUEST).json({
      success: false,
      message: err.errors?.[0]?.message || "Invalid input",
    });
  }

  if (isProduction) {
    res.status(statusCode).json({
      success: false,
      message: message,
    });
  } else {
    console.error(err);
    res.status(statusCode).json({
      success: false,
      message: message,
      reason: err.reason ?? "Reason could not be found.",
      fileStackTrace: err.stack
        .split("\n")
        .slice(1, 4)
        .map((item) => item.trim()),
    });
  }
};

export { errorHandler };
