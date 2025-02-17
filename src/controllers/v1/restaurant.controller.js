import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createRestaurant,
  deleteRestaurantById,
  fuzzySearchRestaurant,
  getNonSensitiveRestaurantInfoById,
  getNonSensitiveRestaurantInfoByRegNo,
  getRestaurantById,
  getRestaurants,
  getRestaurantsByDistanceOrRating,
  getRestaurantsByVerifyStatus,
  setRefreshToken,
  setRestaurantVerificationStatusById,
  updateRestaurantNameOwnerAvailabilityById,
} from "../../database/v1/queries/restaurant.query.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/tokenGenerator.js";
import jwt from "jsonwebtoken";
import {
  deleteImageFromCloudinary,
  uploadImageOnCloudinary,
} from "../../utils/cloudinary.js";
import fs from "fs";
import {
  fuzzySearchRestaurantFoodItem,
  getFoodsByRestaurantId,
} from "../../database/v1/queries/foodItem.query.js";
import { getGeocodeUrl } from "../../utils/geocodeUrl.js";
import {
  getOrdersByRestaurantId,
  updateOrderStatusByOrderId,
} from "../../database/v1/queries/order.query.js";
import { cookieOptions } from "../../constants/cookieOptions.js";
import { checkRequiredFields } from "../../utils/requiredFieldsCheck.js";

const getRestaurantsList = asyncHandler(async (req, res) => {
  const { limit, offset, verifyStatus } = req.query;

  try {
    let restaurantsList;
    if (
      verifyStatus === "verified" ||
      verifyStatus === "pending" ||
      verifyStatus === "rejected"
    ) {
      restaurantsList = await getRestaurantsByVerifyStatus(limit, verifyStatus);
    } else {
      restaurantsList = await getRestaurants(limit, offset);
    }

    if (restaurantsList.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "Restaurant List is empty" },
            "No restaurants found."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse({ restaurantsList }, "Fetched successfully."));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message || "Failed" },
          "Failed to fetch restaurants."
        )
      );
  }
});

const getRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId, sensitive } = req.body;

  if (!restaurantId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: "restaurantId could not be retrieved from req.body",
          at: "restaurant.controller.js -> getRestaurant",
        },
        "Bad request."
      )
    );
  }
  try {
    const restaurant =
      sensitive !== true
        ? await getNonSensitiveRestaurantInfoById(restaurantId)
        : await getRestaurantById(restaurantId);

    if (restaurant.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No restaurant found." },
            "No restaurant found."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          { restaurant: restaurant[0] },
          "Restaurant fetched successfully."
        )
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "restaurant cannot be added",
          at: "restaurant.controller.js -> getRestaurant",
        },
        "Restaurant could not be fetched."
      )
    );
  }
});

const addRestaurant = asyncHandler(async (req, res) => {
  const {
    name,
    registrationNo,
    ownerId,
    city,
    email,
    phoneNumber,
    street,
    landmark,
    pinCode,
    availabilityStatus,
    gstinNo,
    accountNo,
    ifscCode,
    bankName,
    bankBranchCity,
    password,
    confirmPassword,
  } = req.body;

  let { lat, long } = req.body;

  const requiredFields = {
    name,
    phoneNumber,
    email,
    registrationNo,
    ownerId,
    city,
    street,
    pinCode,
    gstinNo,
    accountNo,
    ifscCode,
    bankName,
    bankBranchCity,
    password,
    confirmPassword,
  };

  if (!lat || !long)
    try {
      const address = `${city}, ${pinCode}`;
      const url = getGeocodeUrl(address);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch geocode data");
      }

      const data = await response.json();

      [lat, long] = [data[0].lat, data[0].lon];

      if (!lat || !long) throw new Error("Failed to fetch geocode data");
    } catch (error) {
      return res
        .status(500)
        .json(
          new ApiResponse(
            { error: error.message },
            "Failed to retrieve coordinates"
          )
        );
    }

  checkRequiredFields(requiredFields);

  if (password !== confirmPassword) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: `password: ${password}, confirmPassword: ${confirmPassword}`,
        },
        "Passwords do not match."
      )
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    if (!req.file) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            { reason: `The licenseCopy passed is ${req.file}` },
            "No licenseCopy uploaded."
          )
        );
    }

    const localFilePath = req.file.path;

    const cloudinaryResponse = await uploadImageOnCloudinary(localFilePath);

    if (!cloudinaryResponse.url) {
      return res
        .status(500)
        .json(
          new ApiResponse(
            { reason: "Could not upload image." },
            "Document Upload Failed."
          )
        );
    }

    const licenseUrl = cloudinaryResponse.url;

    const restaurant = await createRestaurant({
      name,
      registrationNo,
      ownerId,
      lat,
      long,
      city,
      street,
      landmark,
      pinCode,
      availabilityStatus: availabilityStatus || false,
      licenseUrl,
      gstinNo,
      accountNo,
      ifscCode,
      bankName,
      bankBranchCity,
      passwordHash,
      email,
      phoneNumber,
    });

    if (!restaurant) {
      await deleteImageFromCloudinary(cloudinaryResponse.public_id);
      return res
        .status(400)
        .json(
          new ApiResponse(
            { reason: "Could not create restaurant." },
            "Could not add restaurant."
          )
        );
    }

    delete restaurant.refresh_token;
    delete restaurant.password;

    return res
      .status(201)
      .json(
        new ApiResponse(
          { restaurant: restaurant[0] },
          "Restaurant added successfully."
        )
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "error occurred during restaurant creation",
          at: "restaurant.controller.js",
        },
        "Unable to add Restaurant."
      )
    );
  } finally {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

const loginRestaurant = asyncHandler(async (req, res) => {
  const { registrationNumber, password } = req.body;

  checkRequiredFields({ registrationNumber, password });

  let restaurant =
    await getNonSensitiveRestaurantInfoByRegNo(registrationNumber);

  if (restaurant.length <= 0) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: "No restaurant found with given credentials" },
          "Restaurant is not registered."
        )
      );
  }

  restaurant = await getRestaurantById(restaurant[0].restaurant_id);

  if (restaurant.length <= 0) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: "No restaurant found with given credentials" },
          "Restaurant is not registered."
        )
      );
  }
  const correctPassword = restaurant[0].password;

  const isPasswordCorrect = await bcrypt.compare(password, correctPassword);

  if (!isPasswordCorrect) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          { reason: "Incorrect Password." },
          "Invalid credentials, please try again."
        )
      );
  }
  const accessToken = generateAccessToken(restaurant[0]);
  const refreshToken = generateRefreshToken(restaurant[0]);

  const restaurantId = restaurant[0].restaurant_id;

  restaurant = await setRefreshToken(refreshToken, restaurantId);

  delete restaurant[0].refresh_token;
  delete restaurant[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        {
          restaurant: restaurant[0],
          accessToken,
          refreshToken,
        },
        "User logged in successfully."
      )
    );
});

const logoutRestaurant = asyncHandler(async (req, res) => {
  try {
    await setRefreshToken("NULL", req.restaurant.restaurant_id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message || "Unable to set refresh token" },
          "Unable to fetch the logged in restaurant."
        )
      );
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(
        { reason: "Logout successful" },
        "Restaurant logged out successfully."
      )
    );
});

const updateRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId, name, licenseUrl, availabilityStatus } = req.body;

  if (
    !restaurantId &&
    !name &&
    !licenseUrl &&
    availabilityStatus === undefined
  ) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: `restaurantId:${restaurantId}, name:${name}, licenseUrl:${licenseUrl}, availabilityStatus:${availabilityStatus}`,
        },
        "Bad request."
      )
    );
  }

  let restaurant = await getRestaurantById(restaurantId);

  if (!restaurant) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: `restaurant is ${restaurant}` },
          "Restaurant not Found."
        )
      );
  }

  try {
    restaurant = await updateRestaurantNameOwnerAvailabilityById(restaurantId, {
      name,
      licenseUrl,
      availabilityStatus,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          { restaurant: restaurant[0] },
          "Restaurant details updated."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Could not update restaurant details."
        )
      );
  }
});

const verifyRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId, managementTeamMemberId } = req.body;
  let { approval } = req.body;

  if (!restaurantId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: { restaurantId },
        },
        "Bad request."
      )
    );
  }

  if (approval === undefined) approval = true;

  let restaurant = await getRestaurantById(restaurantId);

  if (!restaurant) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: `restaurant is ${restaurant}` },
          "Restaurant not Found."
        )
      );
  }

  try {
    restaurant = await setRestaurantVerificationStatusById(
      restaurantId,
      approval
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          { restaurant: restaurant[0] },
          approval
            ? "Restaurant verified."
            : "Restaurant verification rejected."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Could update restaurant verification."
        )
      );
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          { reason: "Request unauthorised" },
          "Unauthorized request."
        )
      );
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    let restaurant = await getNonSensitiveRestaurantInfoById(decodedToken.id);

    restaurant = restaurant[0];

    if (!restaurant) {
      return res
        .status(500)
        .json(
          new ApiResponse(
            { reason: "Token verification failed" },
            "Invalid refresh token."
          )
        );
    }

    if (incomingRefreshToken !== restaurant?.refresh_token)
      return res
        .status(401)
        .json(
          new ApiResponse(
            { reason: "Tokens do not match" },
            "Unable to reinstate session."
          )
        );

    const options = {
      httpOnly: true,
      secure: true,
    };

    const accessToken = generateAccessToken(restaurant);
    const newRefreshToken = generateRefreshToken(restaurant);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          {
            accessToken: accessToken,
            refreshToken: newRefreshToken,
          },
          "Session is reinitialised."
        )
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason:
            error.message || "Error occurred while trying to refresh token",
        },
        "Unable to refresh tokens."
      )
    );
  }
});

const deleteRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId } = req.body;

  if (!restaurantId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: { restaurantId },
        },
        "Bad request."
      )
    );
  }

  let restaurant = await getRestaurantById(restaurantId);

  if (!restaurant) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: `restaurant is ${restaurant}` },
          "Restaurant not Found."
        )
      );
  }

  try {
    restaurant = await deleteRestaurantById(restaurantId);
    return res
      .status(200)
      .json(
        new ApiResponse({ restaurant: restaurant[0] }, "Restaurant deleted.")
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Could not delete restaurant."
        )
      );
  }
});

const getRestaurantCatalog = asyncHandler(async (req, res) => {
  const { limit, restaurantId } = req.query;
  if ((!req.restaurant || !req.restaurant.restaurant_id) && !restaurantId) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: "restaurant id is missing" },
          "Restaurant not found."
        )
      );
  }

  try {
    const restaurant = await getNonSensitiveRestaurantInfoById(
      req.restaurant?.restaurant_id || restaurantId
    );

    if (restaurant.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No restaurant found." },
            "Restaurant not found."
          )
        );
    }

    const catalog = await getFoodsByRestaurantId(
      restaurant[0].restaurant_id || restaurantId,
      limit
    );

    if (catalog.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "Catalog Could not be fetched." },
            "Catalog not found."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          { catalog, restaurant: restaurant[0] },
          "Catalog fetched successfully."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message, error: JSON.stringify(error) },
          "Failed to get food catalog"
        )
      );
  }
});

const searchRestaurantByName = asyncHandler(async (req, res) => {
  const { name } = req.query;

  checkRequiredFields({ name });

  try {
    const restaurantList = await fuzzySearchRestaurant(name);

    if (restaurantList.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No restaurant found with that name." },
            "No restaurants found with this name."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          { restaurantList: restaurantList },
          "Restaurants found with this name."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Failed to get restaurant list"
        )
      );
  }
});

const getRestaurantPendingOrders = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const { restaurant } = req;

  if (!restaurant || !restaurant?.restaurant_id) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: "No restaurants found." },
          "Error getting restaurant."
        )
      );
  }

  try {
    const orders = await getOrdersByRestaurantId(
      restaurant.restaurant_id,
      "Preparing"
    );

    if (orders.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No orders Processing." },
            "No pending orders."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse({ orders: orders }, "Orders found."));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Failed to get pending orders."
        )
      );
  }
});

const getRestaurantPackedOrders = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const { restaurant } = req;

  if (!restaurant || !restaurant?.restaurant_id) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: "No restaurants found." },
          "Error getting restaurant."
        )
      );
  }

  try {
    const orders = await getOrdersByRestaurantId(
      restaurant.restaurant_id,
      "Packed"
    );

    if (orders.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No orders Processing." },
            "No pending orders."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse({ orders: orders }, "Orders found."));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Failed to get pending orders."
        )
      );
  }
});

const getRestaurantCancelledOrders = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const { restaurant } = req;

  if (!restaurant || !restaurant?.restaurant_id) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: "No restaurants found." },
          "Error getting restaurant."
        )
      );
  }

  try {
    const orders = await getOrdersByRestaurantId(
      restaurant.restaurant_id,
      "Cancelled"
    );

    if (orders.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No orders Processing." },
            "No cancelled orders."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse({ orders: orders }, "Orders found."));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Failed to get cancelled orders."
        )
      );
  }
});

const getRestaurantDeliveredOrders = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const { restaurant } = req;

  if (!restaurant || !restaurant?.restaurant_id) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: "No restaurants found." },
          "Error getting restaurant."
        )
      );
  }

  try {
    const orders = await getOrdersByRestaurantId(
      restaurant.restaurant_id,
      "Delivered"
    );

    if (orders.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No orders Processing." },
            "No delivered orders."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse({ orders: orders }, "Orders found."));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Failed to get cancelled orders."
        )
      );
  }
});

const getRecommendedRestaurants = asyncHandler(async (req, res) => {
  const { lat, long, minRating, limit, sortBy, radius, descending } = req.query;

  if (!lat || !long) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "No latitude or longitude provided." },
          "Error getting restaurant."
        )
      );
  }

  if (
    parseFloat(minRating) > 5 ||
    parseFloat(minRating) < 0 ||
    parseInt(limit) < 0
  ) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason: "Error at values",
          minRating: `Minimum rating ${minRating} is ${minRating < 0 || minRating > 5 ? "not " : ""}in range [0, 5].`,
          limit: `${limit < 0 ? "INVALID" : "OK"}: limit ${limit} is ${limit < 0 ? "not " : ""}greater than 0`,
        },
        "Error getting restaurant."
      )
    );
  }

  try {
    const restaurants = await getRestaurantsByDistanceOrRating({
      lat,
      long,
      minRating:
        minRating && minRating.length !== 0 ? parseFloat(minRating) : undefined,
      limit: limit && limit.length !== 0 ? parseInt(limit) : undefined,
      sortBy,
      radius: radius && radius.length !== 0 ? parseFloat(radius) : undefined,
      descending: descending === "true",
    });

    if (restaurants.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No restaurants found" },
            "Error getting restaurant."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          { restaurants },
          "Recommended restaurants fetched successfully."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message },
          "Error getting recommended restaurants."
        )
      );
  }
});

const getRestaurantFoods = asyncHandler(async (req, res) => {
  const { search, restaurantId } = req.query;

  if (!search || !restaurantId) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: "No search query or restaurantId provided." },
          "Error getting food."
        )
      );
  }

  try {
    const foodItems = await fuzzySearchRestaurantFoodItem({
      foodItemName: search,
      restaurantId,
    });

    if (foodItems.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No food Items found." },
            "Error getting food."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse({ foodItems }, "Food Items found."));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse({ reason: error.message }, "Error getting food."));
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { restaurant } = req;
  const { orderId, status } = req.body;

  const restaurantId = restaurant?.restaurant_id;

  checkRequiredFields({ restaurantId, status, orderId });

  try {
    const order = updateOrderStatusByOrderId(orderId, restaurantId, status);

    return res
      .status(200)
      .json(
        new ApiResponse(
          { order: order[0] },
          "Order status updated successfully."
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message || "Error updating order status." },
          "Server error occurred."
        )
      );
  }
});

export {
  getRestaurant,
  getRestaurantsList,
  getRestaurantFoods,
  addRestaurant,
  loginRestaurant,
  logoutRestaurant,
  refreshAccessToken,
  updateRestaurant,
  deleteRestaurant,
  verifyRestaurant,
  getRestaurantCatalog,
  searchRestaurantByName,
  getRestaurantPendingOrders,
  getRestaurantPackedOrders,
  getRestaurantCancelledOrders,
  getRestaurantDeliveredOrders,
  getRecommendedRestaurants,
  updateOrderStatus,
};
