import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import {
  getUserByPhoneNo,
  setRefreshToken,
  createUser,
} from "../db/user.query.js";

const loginUser = asyncHandler(async (req, res) => {
  const { phoneNumber, password } = req.body;

  const requiredFields = [
    { field: phoneNumber, message: "Phone Number is required." },
    { field: password, message: "Password is required." },
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

  let user = await getUserByPhoneNo(phoneNumber);

  if (user.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          401,
          { reason: "User not found" },
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
  console.log(user[0]);
  const accessToken = generateAccessToken(user[0]);
  const refreshToken = generateRefreshToken(user[0]);

  const customerId = user[0].customer_id;

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
    { field: phoneNumber, message: "Phone Number is required." },
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

  const existedUser = await getUserByPhoneNo(phoneNumber);

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
    await setRefreshToken("NULL", req.user.customer_id);
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
    .json(new ApiResponse(200, {}, "User logged out successfully."));
});

export { loginUser, registerUser, logoutUser };
