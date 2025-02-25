import { STATUS } from "../../constants/statusCodes.js";
import { ZodError } from "zod";
import { ApiResponse, DevApiResponse } from "./apiResponse.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Express error-handling middleware.
 *
 * @param {Error} err - The error object.
 * @param {import("express").Request} _req - Express request object (unused).
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} _next - Express next function (unused).
 * @returns {import("express").Response} - JSON response containing error details.
 */
const errorHandler = (err, _req, res, _next) => {
  const statusCode =
    err.statusCode || STATUS.SERVER_ERROR.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal Server Error.";

  // Handle validation errors from Zod
  if (err instanceof ZodError) {
    return res
      .status(STATUS.CLIENT_ERROR.BAD_REQUEST)
      .json(new ApiResponse({}, err.errors?.[0]?.message || "Invalid input"));
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res
      .status(STATUS.CLIENT_ERROR.UNAUTHORIZED)
      .json(new ApiResponse({}, "Invalid token"));
  }

  // Handle TokenExpiredError
  if (err.name === "TokenExpiredError") {
    return res
      .status(STATUS.CLIENT_ERROR.UNAUTHORIZED)
      .json(new ApiResponse({}, "Token expired"));
  }

  // Return standard error response based on environment
  if (isProduction) {
    return res.status(statusCode).json(new ApiResponse({}, message));
  } else {
    console.error(err);
    return res.status(statusCode).json(
      new DevApiResponse(
        {},
        message,
        err.reason ?? "Reason could not be found.",
        err.stack
          .split("\n")
          .slice(1, 4)
          .map((item) => item.trim())
      )
    );
  }
};

export { errorHandler };
