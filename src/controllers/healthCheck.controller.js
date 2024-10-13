import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sql } from "../db/database.js";

/**
 * Performs a health check on the server to confirm it is running.
 *
 * @async
 * @function healthCheck
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with:
 *
 * - **200 OK**: Server is up and running.
 */
const healthCheck = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, {}, "Status OK."));
});

/**
 * Performs a health check on the database to verify if it is connected.
 *
 * @async
 * @function databaseCheck
 * @param {Object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with:
 *
 * - **200 OK**: Database is connected successfully, version information returned.
 * - **500 Internal Server Error**: Database connection failed.
 */
const databaseCheck = asyncHandler(async (req, res) => {
  try {
    const result = await sql`SELECT version()`;
    const { version } = result[0];

    return res
      .status(200)
      .json(
        new ApiResponse(200, { version }, "Database connection is healthy.")
      );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, { ...error }, "Database check failed."));
  }
});

export { healthCheck, databaseCheck };
