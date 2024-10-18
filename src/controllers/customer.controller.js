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
    .json(
      new ApiResponse(200, { customer }, "Customer obtained successfully.")
    );
});

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
      .status(404)
      .json(
        new ApiResponse(
          404,
          { reason: "No customer found with given credentials" },
          "Email is not registered."
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
        "User logged in successfully."
      )
    );
});

const registerCustomer = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email, dateOfBirth, password, confirmPassword } =
    req.body;

  const requiredFields = [
    { field: name, message: "name is required.", reason: `name is ${name}` },
    {
      field: email,
      message: "email is required.",
      reason: `email is ${email}`,
    },
    {
      field: phoneNumber,
      message: "Phone number is required.",
      reason: `phoneNumber is ${phoneNumber}`,
    },
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
          "User already exists."
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
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          error,
          reason: error.message || "Error at customer controller",
        },
        "Something went wrong while registering the user."
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
          "Failed to register user."
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

const logoutCustomer = asyncHandler(async (req, res) => {
  try {
    await setRefreshToken("NULL", req.customer.id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { reason: error.message || "Unable to set refresh token" },
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
          "Unauthorized request."
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
            "Invalid refresh token."
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
            "Unable to reinstate session."
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
          "Session is reinitialised."
        )
      );
  } catch (error) {
    res.status(401).json(
      new ApiResponse(
        401,
        {
          reason:
            error.message || "Error occured while trying to refresh token",
        },
        "Unable to refresh tokens."
      )
    );
  }
});

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
            "User not found."
          )
        );
    }
  } catch (error) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: error.message || "Refresh token could not be verified" },
          "Invalid request."
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
          "Email is not registered"
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
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          reason: error.message || "Unable to fetch the logged in customer.",
        },
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
            { customer: customer[0], imageUrl: cloudinaryResponse.url },
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
          { reason: error.message || "Image could not be uploaded" },
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
