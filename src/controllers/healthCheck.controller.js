import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sql } from "../db/database.js";

const healthCheck = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, {}, "Status OK."));
});

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
