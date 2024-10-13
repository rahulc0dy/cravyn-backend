import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import {
  getCustomerByEmail,
  setRefreshToken,
  createCustomer,
  getCustomerById,
  deleteCustomer,
  updateCustomerNamePhoneNo,
  getNonSensitiveCustomerInfoById,
  updateCustomerImageUrl,
} from "../db/customer.query.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import { uploadImageOnCloudinary } from "../utils/cloudinary.js";

/**
 * Retrieves customer account details, excluding sensitive information.
 *
 * @async
 * @function getCustomerAccount
 * @param {object} req - Express request object, requires `req.customer.id` from the middleware.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with:
 *
 * - **200 OK**: Customer details retrieved successfully.
 * - **401 Unauthorized**: No customer ID found in the request.
 * - **404 Not Found**: Customer not found by the provided ID.
 */
const getCustomerAccount = asyncHandler(async (req, res) => {
  if (!req.customer || !req.customer.id) {
    res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: `req.customer is ${req.customer}` },
          "Unauthorised Access."
        )
      );
  }

  const customer = (await getNonSensitiveCustomerInfoById(req.customer.id))[0];

  if (!customer) {
    res
      .status(404)
      .json(
        new ApiResponse(
          404,
          { reason: `Customer not found by id` },
          "User not found."
        )
      );
  }

  res
    .status(200)
    .json(new ApiResponse(200, { customer }, "Customer obtained successfully"));
});

/**
 * Logs in a customer by verifying email and password, and generates access/refresh tokens.
 *
 * @async
 * @function loginCustomer
 * @param {object} req - Express request object, expects `email` and `password` in the body.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with:
 *
 * - **200 OK**: Customer logged in successfully, access and refresh tokens are provided.
 * - **400 Bad Request**: Missing email or password fields in the request body.
 * - **401 Unauthorized**: Incorrect password or no customer found with the provided credentials.
 * - **503 Service Unavailable**: No customer found for the provided email.
 */
const loginCustomer = asyncHandler(async (req, res) => {
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
      return res.status(400).json(new ApiResponse(400, { reason }, message));
    }
  }

  let customer = await getCustomerByEmail(email);

  if (customer.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          401,
          { reason: "No customer found with given credentials" },
          "Phone number is not registered."
        )
      );
  }
  const correctPassword = customer[0].password;

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
  const accessToken = generateAccessToken(customer[0]);
  const refreshToken = generateRefreshToken(customer[0]);

  const customerId = customer[0].id;

  customer = await setRefreshToken(refreshToken, customerId);

  const options = {
    httpOnly: true,
    secure: true,
  };

  delete customer[0].refresh_token;
  delete customer[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          customer: customer[0],
          accessToken,
          refreshToken,
        },
        "Customer logged in successfully."
      )
    );
});

/**
 * Registers a new customer, ensuring all required fields are provided and valid, and creates the customer account.
 *
 * @async
 * @function registerCustomer
 * @param {object} req - Express request object, expects `name`, `phoneNumber`, `email`, `dateOfBirth`, `password`, and `confirmPassword` in the body.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with:
 *
 * - **201 Created**: Customer registered successfully.
 * - **400 Bad Request**: Missing or invalid fields such as name, date of birth, password, or password confirmation.
 * - **409 Conflict**: Customer with the provided email already exists.
 * - **500 Internal Server Error**: Error occurred during registration or customer creation failed.
 */
const registerCustomer = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email, dateOfBirth, password, confirmPassword } =
    req.body;

  const requiredFields = [
    { field: name, message: "name is required.", reason: `name is ${name}` },
    {
      field: dateOfBirth,
      message: "Date of birth is required.",
      reason: `dateOfBirth is ${dateOfBirth}`,
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
      return res.status(400).json(new ApiResponse(400, { reason }, message));
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

  const existedCustomer = await getCustomerByEmail(email);

  if (existedCustomer.length > 0) {
    return res
      .status(409)
      .json(
        new ApiResponse(
          409,
          { reason: "Customer already registered" },
          "Customer already exists."
        )
      );
  }

  let customer;

  try {
    customer = await createCustomer(
      name,
      phoneNumber,
      email,
      dateOfBirth,
      password
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error },
          "Something went wrong while registering the customer."
        )
      );
  }

  if (!customer) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { reason: "Customer is not defined" },
          "Failed to register customer"
        )
      );
  }

  delete customer.refresh_token;
  delete customer.profile_image_url;
  delete customer.password;

  return res
    .status(201)
    .json(new ApiResponse(201, customer, "Customer registered successfully."));
});

/**
 * Logs out a customer by clearing the refresh token from the database and removing authentication cookies.
 *
 * @async
 * @function logoutCustomer
 * @param {object} req - Express request object, requires `req.customer.id` to identify the logged-in customer.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with:
 *
 * - **200 OK**: Customer logged out successfully, access and refresh tokens are cleared.
 * - **500 Internal Server Error**: Error occurred while logging out or clearing refresh token.
 */
const logoutCustomer = asyncHandler(async (req, res) => {
  try {
    await setRefreshToken("NULL", req.customer.id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error },
          "Unable to fetch the logged in customer."
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
        "Customer logged out successfully."
      )
    );
});

/**
 * Refreshes the access token for a logged-in customer using a valid refresh token.
 *
 * @async
 * @function refreshAccessToken
 * @param {object} req - Express request object, requires `req.cookies.refreshToken` or `req.body.refreshToken` for validation.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with:
 *
 * - **200 OK**: Session reinitialized successfully, new access and refresh tokens provided.
 * - **401 Unauthorized**: Refresh token is missing, invalid, or does not match the stored token.
 * - **500 Internal Server Error**: An error occurred while retrieving the customer or verifying the token.
 */
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

    let customer = await getCustomerById(decodedToken.id);

    customer = customer[0];

    if (!customer) {
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

    if (incomingRefreshToken !== customer?.refresh_token)
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

    const accessToken = generateAccessToken(customer);
    const newRefreshToken = generateRefreshToken(customer);

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

/**
 * Deletes a customer's account after verifying their identity with a refresh token and password.
 *
 * @async
 * @function deleteCustomerAccount
 * @param {object} req - Express request object, requires `req.body.refreshToken` and `req.body.password` for validation.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with:
 *
 * - **200 OK**: Customer account deleted successfully, cookies cleared.
 * - **400 Bad Request**: Required fields (refreshToken or password) are missing.
 * - **401 Unauthorized**: Invalid refresh token, customer not found, or incorrect password.
 * - **500 Internal Server Error**: An error occurred while attempting to delete the customer account.
 */
const deleteCustomerAccount = asyncHandler(async (req, res) => {
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
      return res.status(400).json(new ApiResponse(400, { reason }, message));
    }
  }
  let customer;

  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const customerId = decodedToken?.id;

    customer = await getCustomerById(customerId);

    if (customer.length === 0) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { reason: "Invalid Refresh Token." },
            "Customer not found"
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

  if (customer.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          401,
          { reason: "Unable to get customer" },
          "Phone number is not registered"
        )
      );
  }
  const correctPassword = customer[0].password;

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
    await deleteCustomer(customer[0].id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error, reason: "Unable to fetch the logged in customer." },
          "Failed to delete Customer"
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
        { reason: "Deletion successful" },
        "Customer deleted out successfully."
      )
    );
});

/**
 * Updates the customer's account details such as name and phone number.
 * If a field is not provided in the request, the existing value is retained.
 *
 * @async
 * @function updateCustomerAccount
 * @param {object} req - Express request object, requires `req.body.name` and/or `req.body.phoneNumber`.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with:
 *
 * - **200 OK**: Customer details updated successfully.
 * - **500 Internal Server Error**: An error occurred while attempting to update customer details.
 */
const updateCustomerAccount = asyncHandler(async (req, res) => {
  let { name, phoneNumber } = req.body;

  const existingDetails = (
    await getNonSensitiveCustomerInfoById(req.customer.id)
  )[0];

  name = name ?? existingDetails.name;
  phoneNumber = phoneNumber ?? existingDetails.phone_number;

  let customer;
  try {
    customer = await updateCustomerNamePhoneNo(req.customer.id, {
      name,
      phoneNumber,
    });
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          ...error,
          reason: error.message || "Customer could not be updated",
        },
        "Failed to update customer details."
      )
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { customer: customer[0] },
        "Customer details updated."
      )
    );
});

/**
 * Updates the customer's profile image by uploading it to Cloudinary and saving the URL.
 *
 * @async
 * @function updateCustomerImage
 * @param {object} req - Express request object, expects `req.file` containing the uploaded image file.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with:
 *
 * - **200 OK**: Image uploaded successfully, and the new image URL is provided.
 * - **400 Bad Request**: No image file uploaded in the request.
 * - **500 Internal Server Error**: An error occurred while attempting to upload the image or update the customer's image URL.
 */
const updateCustomerImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            { reason: `The file passed is ${req.file}` },
            "No image file uploaded."
          )
        );
    }

    const localFilePath = req.file.path;

    const cloudinaryResponse = await uploadImageOnCloudinary(localFilePath);

    if (cloudinaryResponse.url) {
      const customer = await updateCustomerImageUrl(
        req.customer.id,
        cloudinaryResponse.url
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { customer, imageUrl: cloudinaryResponse.url },
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
          500,
          { error, reason: error.message || "Image could not be uploaded" },
          error.message || "Internal server error."
        )
      );
  } finally {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

export {
  getCustomerAccount,
  loginCustomer,
  registerCustomer,
  logoutCustomer,
  refreshAccessToken,
  deleteCustomerAccount,
  updateCustomerAccount,
  updateCustomerImage,
};
