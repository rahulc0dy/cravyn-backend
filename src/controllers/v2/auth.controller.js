import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import ApiError from "../../utils/apiError.js";
import { STATUS } from "../../constants/statusCodes.js";
import { z } from "zod";
import { prisma } from "../../utils/prismaClient.js";

const login = asyncHandler(async (req, res) => {});

const register = asyncHandler(async (req, res) => {
  const registerSchema = z
    .object({
      name: z
        .string({ required_error: "Name is required." })
        .min(2, "Name must be at least 2 characters long."),
      email: z
        .string({ required_error: "Email is required." })
        .email("Invalid email address."),
      password: z
        .string({ required_error: "Password is required." })
        .min(6, "Password must be at least 6 characters long."),
      confirmPassword: z.string({
        required_error: "Confirm password is required.",
      }),
      profileImageUrl: z.string().url("Invalid profile image URL.").optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });

  const { name, email, password, profileImageUrl } = registerSchema.parse(
    req.body
  );

  const { role } = z
    .object({
      role: z.enum(
        [
          "CUSTOMER",
          "DELIVERY_PARTNER",
          "RESTAURANT_OWNER",
          "RESTAURANT_TEAM",
          "MANAGEMENT",
          "BUSINESS",
        ],
        {
          required_error:
            "Role is required. Must be one of CUSTOMER, DELIVERY_PARTNER, RESTAURANT_OWNER, RESTAURANT_TEAM, MANAGEMENT, BUSINESS.",
        }
      ),
    })
    .parse(req.query);

  let roleSpecificData;

  switch (role) {
    case "CUSTOMER":
      const { phoneCustomer, dateOfBirth } = z
        .object({
          phone: z
            .string({ required_error: "Phone number is required." })
            .length(10, "Phone number must be exactly 10 digits long."),
          dateOfBirth: z
            .string({ required_error: "Date of birth is required." })
            .regex(
              /^\d{2}-\d{2}-\d{4}$/,
              "Invalid date format. Use DD-MM-YYYY."
            ),
        })
        .parse(req.body);

      roleSpecificData = {
        customer: {
          create: {
            phone: phoneCustomer,
            dateOfBirth: new Date(dateOfBirth),
          },
        },
      };
      break;
    case "DELIVERY_PARTNER":
      const { phoneDeliveryPartner, availability, vehicleType } = z
        .object({
          phone: z
            .string({ required_error: "Phone number is required." })
            .length(10, "Phone number must be exactly 10 digits long."),
          availability: z.boolean({
            required_error: "Availability is required.",
          }),
          vehicleType: z.enum(["BIKE", "CYCLE"], {
            required_error:
              "Vehicle type is required. Must be one of BIKE, CYCLE.",
          }),
        })
        .parse(req.body);

      roleSpecificData = {
        deliveryPartner: {
          create: {
            phone: phoneDeliveryPartner,
            availability,
            vehicleType,
          },
        },
      };
      break;
    case "RESTAURANT_OWNER":
      const { phoneRestaurantOwner, panNumber } = z
        .object({
          phoneRestaurantOwner: z
            .string({ required_error: "Phone number is required." })
            .length(10, "Phone number must be exactly 10 digits long."),
          panNumber: z
            .string({ required_error: "PAN number is required." })
            .length(10, "PAN number must be exactly 10 characters long.")
            .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number format."),
        })
        .parse(req.body);

      roleSpecificData = {
        restaurantOwner: {
          create: {
            phone: phoneRestaurantOwner,
            panNumber,
          },
        },
      };
      break;
    case "RESTAURANT_TEAM":
      break;
    case "MANAGEMENT":
      break;
    case "BUSINESS":
      break;
    default:
      throw new ApiError(
        STATUS.CLIENT_ERROR.BAD_REQUEST,
        "Invalid role",
        "Role must be one of CUSTOMER, DELIVERY_PARTNER, RESTAURANT_OWNER, RESTAURANT_TEAM, MANAGEMENT, BUSINESS."
      );
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role,
      password,
      profileImageUrl,
      ...roleSpecificData,
    },
  });

  return res
    .status(STATUS.SUCCESS.OK)
    .json(
      new ApiResponse(
        user,
        `User registered successfully with the role: ${role}.`
      )
    );
});

const logout = asyncHandler(async (req, res) => {});

export { login, register, logout };
