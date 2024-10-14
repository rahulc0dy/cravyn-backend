import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { getNonSensitiveCustomerInfoById } from "../db/customer.query.js";
import { getNonSensitiveManagementTeamInfoById } from "../db/managementTeam.query.js";
import { getNonSensitiveRestaurantOwnerInfoById } from "../db/restaurantOwner.query.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  const userType = req.baseUrl.split("/")[3];

  if (!token || !userType) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: `Token is ${token}, userType is ${req.query}` },
          "Unauthorized request."
        )
      );
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decodedToken?.id;

    let user;
    switch (userType) {
      case "customer":
        user = await getNonSensitiveCustomerInfoById(userId);
        break;
      case "restaurant-owner":
        user = await getNonSensitiveRestaurantOwnerInfoById(userId);
        break;
      case "management-team":
        user = await getNonSensitiveManagementTeamInfoById(userId);
        break;
      case "business-team":
        // user = await getNonSensitiveBusinessTeamInfoById(userId);
        break;

      default:
        user = [];
        break;
    }

    if (user.length === 0) {
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

    switch (userType) {
      case "customer":
        req.customer = user[0];
        break;
      case "restaurant-owner":
        req.restaurantOwner = user[0];
        break;
      case "management-team":
        req.managementTeam = user[0];
        break;
      case "business-team":
        req.businessTeam = user[0];
        break;

      default:
        req.user = user[0];
        break;
    }

    next();
  } catch (error) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: error.message || "Error at auth middleware" },
          error?.message || "Invalid Access Token."
        )
      );
  }
});
