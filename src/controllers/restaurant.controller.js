import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getRestaurantById,
  createRestaurant,
  updateRestaurantNameOwnerAvailabilityById,
  deleteRestaurantById,
  setRestaurantVerificationStatusById,
  getNonSensitiveRestaurantInfoById,
  getNonSensitiveRestaurantInfoByRegNo,
  setRefreshToken,
  getRestaurants,
  fuzzySearchRestaurant,
} from "../database/queries/restaurant.query.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import jwt from "jsonwebtoken";
import {
  deleteImageFromCloudinary,
  uploadImageOnCloudinary,
} from "../utils/cloudinary.js";
import fs from "fs";
import { getFoodsByRestaurantId } from "../database/queries/foodItem.query.js";
import { getCoordinates } from "./geocode.controller.js";
import { getGeocodeUrl } from "../utils/geocodeUrl.js";
import { getPendingOrdersByRestaurantId } from "../database/queries/order.qury.js";

const getRestaurantsList = asyncHandler(async (req, res) => {
  const { limit, offset } = req.query;

  try {
    const restaurantsList = await getRestaurants(limit, offset);

    if (restaurantsList.length === 0) {
      return res
        .status(401)
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
    lat,
    long,
    city,
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

  const requiredFields = [
    { field: name, message: "Name is required.", reason: `name is ${name}` },
    {
      field: registrationNo,
      message: "Registration number is required.",
      reason: `registrationNo is ${registrationNo}`,
    },
    {
      field: ownerId,
      message: "Unidentified request.",
      reason: `ownerId is ${ownerId}`,
    },
    { field: city, message: "City is required.", reason: `city is ${city}` },
    {
      field: street,
      message: "Street is required.",
      reason: `street is ${street}`,
    },
    {
      field: pinCode,
      message: "Pin code is required.",
      reason: `pinCode is ${pinCode}`,
    },
    {
      field: availabilityStatus,
      message: "Availability status is required.",
      reason: `availabilityStatus is ${availabilityStatus}`,
    },
    {
      field: gstinNo,
      message: "GSTIN No. is required.",
      reason: `gstinNo is ${gstinNo}`,
    },
    {
      field: accountNo,
      message: "AccountNo is required.",
      reason: `accountNo is ${accountNo}`,
    },
    {
      field: ifscCode,
      message: "ifscCode is required.",
      reason: `ifscCode is ${ifscCode}`,
    },
    {
      field: bankName,
      message: "Bank name is required.",
      reason: `bankName is ${bankName}`,
    },
    {
      field: bankBranchCity,
      message: "BankBranchCity is required.",
      reason: `bankBranchCity is ${bankBranchCity}`,
    },
    {
      field: password,
      message: "Password is required.",
      reason: `password is ${password}`,
    },
    {
      field: confirmPassword,
      message: "Password is required.",
      reason: `password is ${password}`,
    },
  ];

  if (!lat || !long)
    try {
      const address = `${city}, ${pinCode}`;
      const url = getGeocodeUrl(address);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch geocode data");
      }

      const data = await response.json();

      const [lat, long] = [data[0].lat, data[0].long];
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

  for (const { field, message, reason } of requiredFields) {
    if (!field) {
      return res.status(400).json(new ApiResponse({ reason }, message));
    }
  }

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
      availabilityStatus,
      licenseUrl,
      gstinNo,
      accountNo,
      ifscCode,
      bankName,
      bankBranchCity,
      passwordHash,
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

  const requiredFields = [
    {
      field: registrationNumber,
      message: "Registration number is required.",
      reason: "Registration number is not defined",
    },
    {
      field: password,
      message: "Password is required.",
      reason: "Password is not defined",
    },
  ];

  for (const { field, message, reason } of requiredFields) {
    if (!field) {
      return res.status(400).json(new ApiResponse({ reason }, message));
    }
  }

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

  const options = {
    httpOnly: true,
    secure: false,
  };
  delete restaurant[0].refresh_token;
  delete restaurant[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
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

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
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
    !restaurantId ||
    !name ||
    !licenseUrl ||
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
  let { acceptVerification } = req.body;

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

  if (acceptVerification === undefined) acceptVerification = true;

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
      acceptVerification
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          { restaurant: restaurant[0] },
          acceptVerification
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
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
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
          { catalog, restaurant: restaurantId ? null : restaurant[0] },
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
    const orders = await getPendingOrdersByRestaurantId(
      restaurant.restaurant_id
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

export {
  getRestaurant,
  getRestaurantsList,
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
};
