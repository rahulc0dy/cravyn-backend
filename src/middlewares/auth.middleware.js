import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { getNonSensitiveCustomerInfoById } from "../database/queries/customer.query.js";
import { getNonSensitiveManagementTeamInfoById } from "../database/queries/managementTeam.query.js";
import { getNonSensitiveRestaurantOwnerInfoById } from "../database/queries/restaurantOwner.query.js";
import { getNonSensitiveBusinessTeamInfoById } from "../database/queries/businessTeam.query.js";
import { getNonSensitiveDeliveryPartnerInfoById } from "../database/queries/deliveryPartner.query.js";
import { getRestaurantById } from "../database/queries/restaurant.query.js";

export const verifyUserJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  const userType = req.baseUrl.split("/")[3];

  if (!token || !userType) {
    return res
      .status(401)
      .json(
        new ApiResponse(
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
        user = await getNonSensitiveBusinessTeamInfoById(userId);
        break;
      case "delivery-partner":
        user = await getNonSensitiveDeliveryPartnerInfoById(userId);
        break;

      default:
        user = [];
        break;
    }

    if (user.length === 0) {
      return res
        .status(401)
        .json(
          new ApiResponse({ reason: "Invalid Access Token" }, "User not found.")
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
      case "delivery-partner":
        req.deliveryPartner = user[0];
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
          { reason: error.message || "Error at auth middleware" },
          error?.message || "Invalid Access Token."
        )
      );
  }
});

export const verifyRestaurantJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          { reason: `Token is ${token}` },
          "Unauthorized request."
        )
      );
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const restaurantId = decodedToken?.id;

    const restaurant = await getRestaurantById(restaurantId);

    if (restaurant.length === 0) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            { reason: "Invalid Access Token" },
            "Restaurant not found."
          )
        );
    }

    req.restaurant = restaurant[0];

    next();
  } catch (error) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          { reason: error.message || "Error at auth middleware" },
          error?.message || "Invalid Access Token."
        )
      );
  }
});
