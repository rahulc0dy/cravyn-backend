import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sql } from "../db/database.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json(new ApiResponse(401, {}, "Unauthorized request."));
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decodedToken?.id;

    // Fetch user details from the database, excluding sensitive information
    const user = await sql`
      SELECT customer_id, name, email_address, phone_number 
      FROM Customer 
      WHERE customer_id = ${userId};
    `;

    if (user.length === 0) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Invalid Access Token."));
    }

    req.user = user[0]; // Set user details to the request object
    next();
  } catch (error) {
    return res
      .status(401)
      .json(
        new ApiResponse(401, {}, error?.message || "Invalid Access Token.")
      );
  }
});
