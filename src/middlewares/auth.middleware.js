import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { getNonSensitiveCustomerInfoById } from "../database/v1/queries/customer.query.js";
import { getNonSensitiveManagementTeamInfoById } from "../database/v1/queries/managementTeam.query.js";
import { getNonSensitiveRestaurantOwnerInfoById } from "../database/v1/queries/restaurantOwner.query.js";
import { getNonSensitiveBusinessTeamInfoById } from "../database/v1/queries/businessTeam.query.js";
import { getNonSensitiveDeliveryPartnerInfoById } from "../database/v1/queries/deliveryPartner.query.js";
import { getRestaurantById } from "../database/v1/queries/restaurant.query.js";
import ApiError from "../utils/apiError.js";
import { STATUS } from "../constants/statusCodes.js";

export const verifyUserJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  const userType = req.baseUrl.split("/")[3];

  if (!token || !userType) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.UNAUTHORIZED,
      !token ? "Authentication token is missing" : "User type is missing",
      "Authorization header or cookie is required"
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
      throw new ApiError(
        STATUS.CLIENT_ERROR.UNAUTHORIZED,
        "Invalid or expired token",
        "Authentication failed"
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
    throw new ApiError(
      STATUS.CLIENT_ERROR.UNAUTHORIZED,
      error.name === "TokenExpiredError"
        ? "Token has expired"
        : "Invalid token format",
      "Please authenticate with valid credentials"
    );
  }
});

export const verifyRestaurantJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.UNAUTHORIZED,
      "Authentication token is missing",
      "Authorization header or cookie is required"
    );
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const restaurantId = decodedToken?.id;

    const restaurant = await getRestaurantById(restaurantId);

    if (restaurant.length === 0) {
      throw new ApiError(
        STATUS.CLIENT_ERROR.UNAUTHORIZED,
        "Unauthorized request.",
        "Invalid Access Token"
      );
    }

    req.restaurant = restaurant[0];

    next();
  } catch (error) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.UNAUTHORIZED,
      "Unauthorized request.",
      error.message
    );
  }
});
