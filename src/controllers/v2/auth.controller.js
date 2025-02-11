import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import ApiError from "../../utils/apiError.js";
import { STATUS } from "../../constants/statusCodes.js";
import { z } from "zod";

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
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });

  const { role } = req.query;

  let validatedData;
  try {
    validatedData = registerSchema.parse(req.body);
  } catch (error) {
    throw new ApiError(
      STATUS.BAD_REQUEST,
      error.errors?.[0]?.message || "Invalid input"
    );
  }

  const { name, email, password, confirmPassword } = validatedData;

  const user = {
    email,
    password,
  };

  return res
    .status(STATUS.SUCCESS.OK)
    .json(new ApiResponse(user, "User registered successfully."));
});

const logout = asyncHandler(async (req, res) => {});

export { login, register, logout };
