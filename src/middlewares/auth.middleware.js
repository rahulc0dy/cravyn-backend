import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { getNonSensitiveCustomerInfoById } from "../db/customer.query.js";

/**
 * Middleware to verify JSON Web Tokens (JWT) for protected routes.
 *
 * This middleware checks for a valid access token in the request cookies or headers.
 * If the token is present, it verifies the token and retrieves the associated customer information.
 * If the token is invalid or not found, it sends an unauthorized response.
 *
 * @function verifyJwt
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} - Returns a response with a status code and a JSON object containing the result of the verification.
 *
 * @throws {401} - If the token is missing, invalid, or if the customer associated with the token is not found.
 */
export const verifyJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: `Token is ${token}` },
          "Unauthorized request."
        )
      );
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const customerId = decodedToken?.id;

    const customer = await getNonSensitiveCustomerInfoById(customerId);

    if (customer.length === 0) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { reason: "Invalid Access Token" },
            "Customer not found."
          )
        );
    }

    req.customer = customer[0]; // Set customer details to the request object
    next();
  } catch (error) {
    return res
      .status(401)
      .json(
        new ApiResponse(401, {}, error?.message || "Invalid Access Token.")
      );
  }
});
