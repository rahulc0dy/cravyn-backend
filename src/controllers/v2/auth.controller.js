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

const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

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
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  // Remove password before sending response
  const { password: _unused, ...sanitizedUser } = user;

  return res
    .status(STATUS.SUCCESS.OK)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        {
          ...sanitizedUser, // contains refresh token
          accessToken,
        },
        "User logged in successfully."
      )
    );
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password, profileImageUrl } = registerSchema.parse(
    req.body
  );

  const { role } = roleSchema.parse(req.query);

  let roleSpecificData;

  switch (role) {
    case "CUSTOMER": {
      const { phone, dateOfBirth } = customerSchema.parse(req.body);

      roleSpecificData = {
        customer: {
          create: {
            phone,
            dateOfBirth: new Date(dateOfBirth),
          },
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
          create: {
            phone,
            availability,
            vehicleType,
          },
        },
      };

      break;
    }
    case "RESTAURANT_OWNER": {
      const { phone, panNumber } = restaurantOwnerSchema.parse(req.body);

      roleSpecificData = {
        restaurantOwner: {
          create: {
            phone,
            panNumber,
          },
        },
      };

      break;
    }
    case "RESTAURANT_TEAM": {
      break;
    }
    case "MANAGEMENT": {
      throw new ApiError(
        STATUS.CLIENT_ERROR.BAD_REQUEST,
        "Management team member cannot self register. To get added as a management team member, contact the admin."
      );
    }
    case "BUSINESS": {
      throw new ApiError(
        STATUS.CLIENT_ERROR.BAD_REQUEST,
        "Business team member cannot self register. To get added as a business team member, contact the admin."
      );
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.CONFLICT,
      "User with this email already exists."
    );
  }

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

const logout = asyncHandler(async (req, res) => {});

export { login, register, logout };
