import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import {
  setRefreshToken,
  createRestaurantOwner,
  getRestaurantOwnerById,
  getRestaurantOwnerByEmail,
  deleteRestaurantOwner,
  updateRestaurantOwnerNamePhoneNo,
  getNonSensitiveRestaurantOwnerInfoById,
} from "../database/queries/restaurantOwner.query.js";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../constants.js";

const getRestaurantOwnerAccount = asyncHandler(async (req, res) => {
  if (!req.restaurantOwner || !req.restaurantOwner.id) {
    res
      .status(401)
      .json(
        new ApiResponse(
          { reason: `req.restaurantOwner is ${req.restaurantOwner}` },
          "Unauthorised Access."
        )
      );
  }

  const restaurantOwner = (
    await getNonSensitiveRestaurantOwnerInfoById(req.restaurantOwner.id)
  )[0];

  if (!restaurantOwner) {
    res
      .status(404)
      .json(
        new ApiResponse(
          { reason: `RestaurantOwner not found by id` },
          "User not found."
        )
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        { restaurantOwner },
        "RestaurantOwner obtained successfully"
      )
    );
});

const loginRestaurantOwner = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const requiredFields = [
    {
      field: email,
      message: "Email is required.",
      reason: "Email is not defined",
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

  let restaurantOwner = await getRestaurantOwnerByEmail(email);

  if (restaurantOwner.length <= 0) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: "No restaurantOwner found with given credentials" },
          "Email is not registered."
        )
      );
  }
  const correctPassword = restaurantOwner[0].password;

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
  const accessToken = generateAccessToken(restaurantOwner[0]);
  const refreshToken = generateRefreshToken(restaurantOwner[0]);

  const restaurantOwnerId = restaurantOwner[0].id;

  restaurantOwner = await setRefreshToken(refreshToken, restaurantOwnerId);

  delete restaurantOwner[0].refresh_token;
  delete restaurantOwner[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        {
          restaurantOwner: restaurantOwner[0],
          accessToken,
          refreshToken,
        },
        "RestaurantOwner logged in successfully."
      )
    );
});

const registerRestaurantOwner = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email, panNumber, password, confirmPassword } =
    req.body;

  const requiredFields = [
    { field: name, message: "name is required.", reason: `name is ${name}` },
    {
      field: panNumber,
      message: "Pan number is required.",
      reason: `panNumber is ${panNumber}`,
    },
    {
      field: email,
      message: "Email is required.",
      reason: `email is ${email}`,
    },
    {
      field: phoneNumber,
      message: "Phone number is required.",
      reason: `phoneNumber is ${phoneNumber}`,
    },
    {
      field: password,
      message: "Password is required.",
      reason: `password is ${password}`,
    },
    {
      field: confirmPassword,
      message: "Confirm password is required.",
      reason: `confirmPassword is ${confirmPassword}`,
    },
  ];

  for (const { field, message, reason } of requiredFields) {
    if (!field) {
      return res.status(400).json(new ApiResponse({ reason }, message));
    }
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "Passwords do not match" },
          "Password confirmation does not match."
        )
      );
  }

  const existedRestaurantOwner = await getRestaurantOwnerByEmail(email);

  if (existedRestaurantOwner.length > 0) {
    return res
      .status(409)
      .json(
        new ApiResponse(
          { reason: "RestaurantOwner already registered" },
          "RestaurantOwner already exists."
        )
      );
  }

  let restaurantOwner;

  try {
    restaurantOwner = await createRestaurantOwner(
      name,
      phoneNumber,
      email,
      panNumber,
      password
    );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          error,
          reason: error.message || "Error at restaurant owner creation query",
        },
        "Something went wrong while registering the restaurantOwner."
      )
    );
  }

  if (!restaurantOwner) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: "RestaurantOwner is not defined" },
          "Failed to register restaurantOwner"
        )
      );
  }

  delete restaurantOwner.refresh_token;
  delete restaurantOwner.profile_image_url;
  delete restaurantOwner.password;

  return res
    .status(201)
    .json(
      new ApiResponse(
        restaurantOwner,
        "RestaurantOwner registered successfully."
      )
    );
});

const logoutRestaurantOwner = asyncHandler(async (req, res) => {
  try {
    await setRefreshToken("NULL", req.restaurantOwner.id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message || "Unable to set refresh token" },
          "Unable to fetch restaurant owner."
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
        "Restaurant owner logged out successfully."
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    res
      .status(401)
      .json(
        ApiResponse({ reason: "Request unauthorised" }, "Unauthorized request.")
      );
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    let restaurantOwner = await getRestaurantOwnerById(decodedToken.id);

    restaurantOwner = restaurantOwner[0];

    if (!restaurantOwner) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            { reason: "Token verification failed" },
            "Invalid refresh token."
          )
        );
    }

    if (incomingRefreshToken !== restaurantOwner?.refresh_token)
      res
        .status(401)
        .json(
          new ApiResponse(
            { reason: "Tokens do not match" },
            "Unable to reinstate session"
          )
        );

    const options = {
      httpOnly: true,
      secure: true,
    };

    const accessToken = generateAccessToken(restaurantOwner);
    const newRefreshToken = generateRefreshToken(restaurantOwner);

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
          "Session is reinitialised"
        )
      );
  } catch (error) {
    res
      .status(401)
      .json(
        new ApiResponse(
          { ...error, reason: "Error occured while trying to refresh token" },
          error?.message || "Invalid refresh token"
        )
      );
  }
});

const deleteRestaurantOwnerAccount = asyncHandler(async (req, res) => {
  const { refreshToken, password } = req.body;

  const requiredFields = [
    {
      field: refreshToken,
      message: "Invalid Request.",
      reason: `refreshToken is ${refreshToken}`,
    },
    {
      field: password,
      message: "Password is required.",
      reason: `password is ${password}`,
    },
  ];

  for (const { field, message, reason } of requiredFields) {
    if (!field) {
      return res.status(400).json(new ApiResponse({ reason }, message));
    }
  }
  let restaurantOwner;

  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const restaurantOwnerId = decodedToken?.id;

    restaurantOwner = await getRestaurantOwnerById(restaurantOwnerId);

    if (restaurantOwner.length === 0) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            { reason: "Invalid Refresh Token." },
            "Restaurant owner not found."
          )
        );
    }
  } catch (error) {
    return res.status(401).json(
      new ApiResponse(
        {
          reason: error?.message || "Refresh token could not be verified",
        },
        "Invalid request."
      )
    );
  }

  if (restaurantOwner.length <= 0) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          { reason: "Unable to get restaurantOwner" },
          "Email is not registered."
        )
      );
  }
  const correctPassword = restaurantOwner[0].password;

  const isPasswordCorrect = await bcrypt.compare(password, correctPassword);

  if (!isPasswordCorrect) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          { reason: "Incorrect Password" },
          "Invalid credentials, please try again."
        )
      );
  }

  try {
    await deleteRestaurantOwner(restaurantOwner[0].id);
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          ...error,
          reason: "Unable to fetch the logged in restaurantOwner.",
        },
        "Failed to delete restaurant owner."
      )
    );
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(
        { reason: "Deletion successful" },
        "RestaurantOwner deleted out successfully."
      )
    );
});

const updateRestaurantOwnerAccount = asyncHandler(async (req, res) => {
  let { name, phoneNumber } = req.body;

  const existingDetails = (
    await getNonSensitiveRestaurantOwnerInfoById(req.restaurantOwner.id)
  )[0];

  name = name ?? existingDetails.name;
  phoneNumber = phoneNumber ?? existingDetails.phone_number;

  let restaurantOwner;
  try {
    restaurantOwner = await updateRestaurantOwnerNamePhoneNo(
      req.restaurantOwner.id,
      {
        name,
        phoneNumber,
      }
    );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          ...error,
          reason: error.message || "RestaurantOwner could not be updated",
        },
        "Failed to update restaurantOwner details."
      )
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        { restaurantOwner: restaurantOwner[0] },
        "RestaurantOwner details updated."
      )
    );
});

const updateRestaurantOwnerImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            { reason: `The file passed is ${req.file}` },
            "No image file uploaded."
          )
        );
    }

    const localFilePath = req.file.path;

    const cloudinaryResponse = await uploadImageOnCloudinary(localFilePath);

    if (cloudinaryResponse.url) {
      const restaurantOwner = await updateRestaurantOwnerImageUrl(
        req.restaurantOwner.id,
        cloudinaryResponse.url
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            { restaurantOwner, imageUrl: cloudinaryResponse.url },
            "Image uploaded successfully."
          )
        );
    } else {
      throw new Error("Failed to upload image to Cloudinary.");
    }
  } catch (error) {
    res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message || "Image could not be uploaded" },
          "Internal server error."
        )
      );
  } finally {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

export {
  getRestaurantOwnerAccount,
  loginRestaurantOwner,
  registerRestaurantOwner,
  logoutRestaurantOwner,
  refreshAccessToken,
  deleteRestaurantOwnerAccount,
  updateRestaurantOwnerAccount,
};
