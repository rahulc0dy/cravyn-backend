import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { getNonSensitiveCustomerInfoById } from "../db/customer.query.js";

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
