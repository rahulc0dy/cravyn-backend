import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import {
  getUserByEmail,
  setRefreshToken,
  createUser,
  getUserById,
  deleteUser,
  updateUser,
  getNonSensitiveUserInfoById,
} from "../db/user.query.js";
import jwt from "jsonwebtoken";

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const requiredFields = [
    { field: email, message: "Email is required." },
    { field: password, message: "Password is required." },
  ];

  for (const { field, message } of requiredFields) {
    if (!field) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            { reason: `${email ? "Password" : "email"} is required` },
            message
          )
        );
    }
  }

  let user = await getUserByEmail(email);

  if (user.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          401,
          { reason: "No user found with given credentials" },
          "Phone number is not registered."
        )
      );
  }
  const correctPassword = user[0].password;

  const isPasswordCorrect = await bcrypt.compare(password, correctPassword);

  if (!isPasswordCorrect) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: "Incorrect Password." },
          "Invalid credentials, please try again."
        )
      );
  }
  const accessToken = generateAccessToken(user[0]);
  const refreshToken = generateRefreshToken(user[0]);

  const customerId = user[0].id;

  user = await setRefreshToken(refreshToken, customerId);

  const options = {
    httpOnly: true,
    secure: true,
  };

  delete user[0].refresh_token;
  delete user[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: user,
          accessToken,
          refreshToken,
        },
        "User logged in successfully."
      )
    );
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email, dateOfBirth, password, confirmPassword } =
    req.body;

  const requiredFields = [
    { field: name, message: "Name is required." },
    { field: dateOfBirth, message: "Date of birth is required." },
    { field: password, message: "Password is required." },
    { field: confirmPassword, message: "Confirm password is required." },
  ];

  for (const { field, message } of requiredFields) {
    if (!field) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, { reason: `${field} is required` }, message)
        );
    }
  }
  if (password !== confirmPassword) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          { reason: "Passwords do not match" },
          "Password confirmation does not match."
        )
      );
  }

  const existedUser = await getUserByEmail(email);

  if (existedUser.length > 0) {
    return res
      .status(409)
      .json(
        new ApiResponse(
          409,
          { reason: "User already registered" },
          "User already exists."
        )
      );
  }

  let user;

  try {
    user = await createUser(name, phoneNumber, email, dateOfBirth, password);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error },
          "Something went wrong while registering the user."
        )
      );
  }

  if (!user) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { reason: "User is not defined" },
          "Failed to register user"
        )
      );
  }

  delete user.refresh_token;
  delete user.profile_image_url;
  delete user.password;

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully."));
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await setRefreshToken("NULL", req.user.id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error },
          "Unable to fetch the logged in user."
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
        200,
        { reason: "Logout successful" },
        "User logged out successfully."
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
        ApiResponse(
          401,
          { reason: "Request unauthorised" },
          "Unauthorized request"
        )
      );
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    let user = await getUserById(decodedToken.id);

    user = user[0];

    if (!user) {
      return res
        .status(500)
        .json(
          new ApiResponse(
            401,
            { reason: "Token verification failed" },
            "Invalid refresh token"
          )
        );
    }

    if (incomingRefreshToken !== user?.refresh_token)
      res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { reason: "Tokens do not match" },
            "Unable to reinstate session"
          )
        );

    const options = {
      httpOnly: true,
      secure: true,
    };

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
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
          401,
          { ...error, reason: "Error occured while trying to refresh token" },
          error?.message || "Invalid refresh token"
        )
      );
  }
});

const deleteUserAccount = asyncHandler(async (req, res) => {
  const { refreshToken, password } = req.body;

  const requiredFields = [
    { field: refreshToken, message: "Invalid Request." },
    { field: password, message: "Password is required." },
  ];

  for (const { field, message } of requiredFields) {
    if (!field) {
      return res.status(400).json(
        new ApiResponse(
          400,
          {
            reason: `${field == refreshToken ? "Refresh Token" : "Password"} is required`,
          },
          message
        )
      );
    }
  }
  let user;

  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const userId = decodedToken?.id;

    user = await getUserById(userId);

    if (user.length === 0) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { reason: "Invalid Refresh Token." },
            "User not found"
          )
        );
    }
  } catch (error) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { ...error, reason: "Refresh token could not be verified" },
          error?.message || "Invalid request"
        )
      );
  }

  if (user.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          401,
          { reason: "Unable to get user" },
          "Phone number is not registered"
        )
      );
  }
  const correctPassword = user[0].password;

  const isPasswordCorrect = await bcrypt.compare(password, correctPassword);

  if (!isPasswordCorrect) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: "Incorrect Password" },
          "Invalid credentials, please try again."
        )
      );
  }

  try {
    await deleteUser(user[0].id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error, reason: "Unable to fetch the logged in user." },
          "Failed to delete User"
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
        200,
        { reason: "Deletion successfull" },
        "User deleted out successfully."
      )
    );
});

const updateUserDetails = asyncHandler(async (req, res) => {
  let { name, phoneNumber } = req.body;

  const existingDetails = (await getNonSensitiveUserInfoById(req.user.id))[0];

  name = name ?? existingDetails.name;
  phoneNumber = phoneNumber ?? existingDetails.phone_number;

  let user;
  try {
    user = await updateUser(req.user.id, {
      name,
      phoneNumber,
    });
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error, reason: error.message || "User could not be updated" },
          "Failed to update user details."
        )
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user, reason: "Update user successful" },
        "User details updated."
      )
    );
});

export {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  deleteUserAccount,
  updateUserDetails,
};
