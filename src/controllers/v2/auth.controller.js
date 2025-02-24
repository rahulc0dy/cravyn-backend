import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import ApiError from "../../utils/apiError.js";
import { STATUS } from "../../constants/statusCodes.js";
import { prisma } from "../../utils/prismaClient.js";
import bcrypt from "bcrypt";
import { registerSchema } from "../../models/v2/auth/register.schema.js";
import { roleSchema } from "../../models/v2/auth/role.schema.js";
import { customerSchema } from "../../models/v2/auth/customer.schema.js";
import { deliveryPartnerSchema } from "../../models/v2/auth/deliveryPartner.schema.js";
import { restaurantOwnerSchema } from "../../models/v2/auth/restaurantOwner.schema.js";
import { loginSchema } from "../../models/v2/auth/login.schema.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/v2/tokenGenerator.js";
import { cookieOptions } from "../../constants/cookieOptions.js";
import jwt from "jsonwebtoken";

/**
 * Handles user login by verifying credentials, generating authentication tokens,
 * and storing the refresh token in the database.
 *
 * @route POST /auth/login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {ApiError} If email is not registered or password is incorrect
 */
const login = asyncHandler(async (req, res) => {
  // Validate request body against schema
  const { email, password } = loginSchema.parse(req.body);

  // Find user by email in the database
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.UNAUTHORIZED,
      "Email address is not registered."
    );
  }

  // Validate password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.UNAUTHORIZED,
      "Password is incorrect. Try again!"
    );
  }

  // Generate authentication tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store the refresh token in the database
  user = await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  // Remove sensitive data before sending response
  const { password: _unused, ...sanitizedUser } = user;

  return res
    .status(STATUS.SUCCESS.OK)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        { ...sanitizedUser, accessToken },
        "User logged in successfully."
      )
    );
});

/**
 * Handles user registration by validating user input, encrypting the password,
 * and creating a user record in the database.
 *
 * @route POST /auth/register
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {ApiError} If the email already exists or invalid role provided
 */
const register = asyncHandler(async (req, res) => {
  // Validate request body against schema
  const { name, email, password, profileImageUrl } = registerSchema.parse(
    req.body
  );
  const { role } = roleSchema.parse(req.query);

  let roleSpecificData;

  // Assign role-specific attributes
  switch (role) {
    case "CUSTOMER": {
      const { phone, dateOfBirth } = customerSchema.parse(req.body);
      roleSpecificData = {
        customer: {
          create: { phone, dateOfBirth: new Date(dateOfBirth) },
        },
      };
      break;
    }
    case "DELIVERY_PARTNER": {
      const { phone, availability, vehicleType } = deliveryPartnerSchema.parse(
        req.body
      );
      roleSpecificData = {
        deliveryPartner: {
          create: { phone, availability, vehicleType },
        },
      };
      break;
    }
    case "RESTAURANT_OWNER": {
      const { phone, panNumber } = restaurantOwnerSchema.parse(req.body);
      roleSpecificData = {
        restaurantOwner: {
          create: { phone, panNumber },
        },
      };
      break;
    }
    case "RESTAURANT_TEAM": {
      break;
    }
    case "MANAGEMENT":
    case "BUSINESS": {
      throw new ApiError(
        STATUS.CLIENT_ERROR.BAD_REQUEST,
        `${role} team members cannot self register. Contact the admin to get added.`
      );
    }
  }

  // Check if the user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.CONFLICT,
      "User with this email already exists."
    );
  }

  // Create new user with hashed password
  const user = await prisma.user.create({
    data: {
      email,
      name,
      role,
      password: await bcrypt.hash(password, 10),
      profileImageUrl,
      ...roleSpecificData,
    },
  });

  // Remove sensitive fields before responding
  const { password: _unused, refreshToken: _null, ...sanitizedUser } = user;

  return res
    .status(STATUS.SUCCESS.CREATED)
    .json(
      new ApiResponse(
        sanitizedUser,
        `User registered successfully with the role: ${role}.`
      )
    );
});

/**
 * Handles user logout by clearing authentication cookies and removing refresh token.
 *
 * @route POST /auth/logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = asyncHandler(async (req, res) => {
  // Store the refresh token in the database
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  return res
    .status(STATUS.SUCCESS.OK)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse({}, "User logged out successfully."));
});

/**
 * This function verifies the provided refresh token, generates a new access token,
 * and updates the refresh token in the database. The new tokens are then sent
 * back as HTTP-only cookies.
 *
 * @route POST /auth/refresh-token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Extract refresh token from cookies or request body
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.BAD_REQUEST,
      "Refresh token is required."
    );
  }

  // Verify the refresh token using JWT
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const userId = decodedToken?.id;

  // Fetch user details from the database
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.NOT_FOUND,
      "Unable to reinstate session.",
      "User not found."
    );
  }

  // Ensure the stored refresh token matches the provided one
  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.UNAUTHORIZED,
      "Unable to reinstate session.",
      "Tokens do not match."
    );
  }

  // Generate new access and refresh tokens
  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Update refresh token in database
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  // Set new tokens in HTTP-only cookies and return response
  return res
    .status(STATUS.SUCCESS.OK)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        {
          accessToken,
          refreshToken: newRefreshToken,
        },
        "Session successfully reinitialized."
      )
    );
});

export { login, register, logout, refreshAccessToken };
