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
} from "../database/queries/restaurant.query.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import jwt from "jsonwebtoken";

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
  console.log(sensitive);
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
    licenseUrl,
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
      field: licenseUrl,
      message: "License URL is required.",
      reason: `licenseUrl is ${licenseUrl}`,
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
    secure: true,
  };
  console.log(restaurant[0]);
  delete restaurant[0].refresh_token;
  delete restaurant[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        {
          customer: restaurant[0],
          accessToken,
          refreshToken,
        },
        "User logged in successfully."
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

const updateRestaurantPassword = asyncHandler(async (req, res) => {
  const { restaurantId, password } = req.body;
});

const verifyRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId } = req.body;
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
    res
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

    let restaurant = await getCustomerById(decodedToken.id);

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
      res
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
    res.status(401).json(
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

export {
  getRestaurant,
  addRestaurant,
  loginRestaurant,
  refreshAccessToken,
  updateRestaurant,
  deleteRestaurant,
  verifyRestaurant,
};
