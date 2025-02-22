import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import ApiError from "../../utils/apiError.js";
import { STATUS } from "../../constants/statusCodes.js";
import { z } from "zod";
import { prisma } from "../../utils/prismaClient.js";
import bcrypt from "bcrypt";
import { registerSchema } from "../../models/v2/auth/register.schema.js";
import { phoneSchema } from "../../models/v2/auth/phone.schema.js";
import { roleSchema } from "../../models/v2/auth/role.schema.js";
import { customerSchema } from "../../models/v2/auth/customer.schema.js";
import { deliveryPartnerSchema } from "../../models/v2/auth/deliveryPartner.schema.js";
import { restaurantOwnerSchema } from "../../models/v2/auth/restaurantOwner.schema.js";

const login = asyncHandler(async (req, res) => {});

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
      break;
    }
    case "BUSINESS": {
      break;
    }
    default:
      throw new ApiError(
        STATUS.CLIENT_ERROR.BAD_REQUEST,
        "Invalid role",
        "Role must be one of CUSTOMER, DELIVERY_PARTNER, RESTAURANT_OWNER, RESTAURANT_TEAM, MANAGEMENT, BUSINESS."
      );
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

  const { password: _unused, ...sanitizedUser } = user;

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
