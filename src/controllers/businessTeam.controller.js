import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import {
  createBusinessTeam,
  deleteBusinessTeam,
  getBusinessTeamByEmail,
  getBusinessTeamById,
  getCategorySalesData,
  getCustomerMetrics,
  getDailySales,
  getMonthlySales,
  getNonSensitiveBusinessTeamInfoById,
  getRestaurantDailySalesData,
  getRestaurantMonthlySalesData,
  getRestaurantSalesData,
  getRestaurantYearlyMonthlySalesData,
  getTotalUsers,
  setRefreshToken,
  updateBusinessTeamNamePhoneNo,
} from "../database/queries/businessTeam.query.js";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../constants.js";
import { checkRequiredFields } from "../utils/requiredFieldsCheck.js";
import ApiError from "../utils/apiError.js";

const getBusinessTeamAccount = asyncHandler(async (req, res) => {
  if (!req.businessTeam || !req.businessTeam.id)
    throw new ApiError(
      400,
      "Business Team not found.",
      "req.businessTeam not found."
    );

  const businessTeam = (
    await getNonSensitiveBusinessTeamInfoById(req.businessTeam.id)
  )[0];

  if (!businessTeam)
    throw new ApiError(
      404,
      `Business Team not found.`,
      "businessTeam not found."
    );

  return res
    .status(200)
    .json(
      new ApiResponse({ businessTeam }, "BusinessTeam obtained successfully.")
    );
});

const loginBusinessTeam = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  checkRequiredFields({ email, password });

  let businessTeam = await getBusinessTeamByEmail(email);

  if (businessTeam.length <= 0)
    throw new ApiError(
      404,
      `BusinessTeam member not found with email ${email}`,
      "no businessTeam member found with invalid email."
    );

  const correctPassword = businessTeam[0].password;

  const isPasswordCorrect = await bcrypt.compare(password, correctPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(
      401,
      "Password is incorrect.",
      "Passwords do not match from db."
    );
  }
  const accessToken = generateAccessToken(businessTeam[0]);
  const refreshToken = generateRefreshToken(businessTeam[0]);

  const businessTeamId = businessTeam[0].id;

  businessTeam = await setRefreshToken(refreshToken, businessTeamId);

  delete businessTeam[0].refresh_token;
  delete businessTeam[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        {
          user: businessTeam[0],
          accessToken,
          refreshToken,
        },
        "BusinessTeam logged in successfully."
      )
    );
});

const registerBusinessTeam = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email, password, confirmPassword } = req.body;

  checkRequiredFields({ name, email, phoneNumber, password, confirmPassword });

  if (password !== confirmPassword) {
    throw new ApiError(
      400,
      "Passwords do not match.",
      "Passwords do not match."
    );
  }

  const existedBusinessTeam = await getBusinessTeamByEmail(email);

  if (existedBusinessTeam.length > 0) {
    throw new ApiError(
      400,
      "This email is already registered.",
      "Duplicate email."
    );
  }

  let businessTeam = await createBusinessTeam(
    name,
    phoneNumber,
    email,
    password
  );

  if (!businessTeam) {
    throw new ApiError(
      500,
      "Failed to register business team.",
      "businessTeam not created."
    );
  }

  delete businessTeam.refresh_token;
  delete businessTeam.profile_image_url;
  delete businessTeam.password;

  return res
    .status(201)
    .json(
      new ApiResponse(businessTeam, "BusinessTeam registered successfully.")
    );
});

const logoutBusinessTeam = asyncHandler(async (req, res) => {
  try {
    await setRefreshToken("NULL", req.businessTeam.id);
  } catch (error) {
    throw new ApiError(500, "Unable to get login session.", error.message);
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(
        {
          reason: "Logout successful",
        },
        "BusinessTeam logged out successfully."
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request.", "invalid refresh token.");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  let businessTeam = await getBusinessTeamById(decodedToken.id);

  businessTeam = businessTeam[0];

  if (!businessTeam) {
    throw new ApiError(401, "Invalid refresh token.", "invalid refresh token.");
  }

  if (incomingRefreshToken !== businessTeam?.refresh_token) {
    throw new ApiError(
      401,
      "Authentication expired.",
      "refresh tokens do not match."
    );
  }

  const accessToken = generateAccessToken(businessTeam);
  const newRefreshToken = generateRefreshToken(businessTeam);

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
        "Session is reinitialised."
      )
    );
});

const deleteBusinessTeamAccount = asyncHandler(async (req, res) => {
  const { refreshToken, password } = req.body;

  checkRequiredFields({ refreshToken, password });
  let businessTeam;

  const decodedToken = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const businessTeamId = decodedToken?.id;

  businessTeam = await getBusinessTeamById(businessTeamId);

  if (businessTeam.length === 0) {
    throw new ApiError(
      404,
      "Business Team not found.",
      "Invalid refresh token."
    );
  }

  const correctPassword = businessTeam[0].password;

  const isPasswordCorrect = await bcrypt.compare(password, correctPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(
      401,
      "Invalid credentials, please try again.",
      "passwords do not match."
    );
  }

  try {
    await deleteBusinessTeam(businessTeam[0].id);
  } catch (error) {
    throw new ApiError(500, "Failed to delete business team.", error.message);
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(
        { reason: "Deletion successful" },
        "BusinessTeam deleted out successfully."
      )
    );
});

const updateBusinessTeamAccount = asyncHandler(async (req, res) => {
  let { name, phoneNumber } = req.body;

  checkRequiredFields({ name, phoneNumber });

  const existingDetails = (
    await getNonSensitiveBusinessTeamInfoById(req.businessTeam.id)
  )[0];

  name = name ?? existingDetails.name;
  phoneNumber = phoneNumber ?? existingDetails.phone_number;

  let businessTeam;
  try {
    businessTeam = await updateBusinessTeamNamePhoneNo(req.businessTeam.id, {
      name,
      phoneNumber,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Phone number already in use", error.message);
    }
    +throw new ApiError(500, "Failed to update business team", error.message);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        { businessTeam: businessTeam[0] },
        "BusinessTeam details updated."
      )
    );
});

const getDashboardData = asyncHandler(async (req, res) => {
  const { businessTeam } = req;
  const { year, month, day } = req.query;

  try {
    const [
      totalSalesData,
      totalUsers,
      categorySales,
      monthlySales,
      dailySales,
      customerMetrics,
    ] = await Promise.all([
      getRestaurantSalesData(),
      getTotalUsers(),
      getCategorySalesData(),
      getMonthlySales(),
      getDailySales(),
      getCustomerMetrics(),
    ]);
    const rangedSalesData =
      year || month || day
        ? await getRestaurantYearlyMonthlySalesData({
            year,
            month,
            day,
          })
        : [];

    return res.status(200).json(
      new ApiResponse({
        totalSalesData,
        rangedSalesData,
        totalUsers: totalUsers[0],
        categorySales,
        customerMetrics: customerMetrics[0],
        monthlySales,
        dailySales,
      })
    );
  } catch (error) {
    throw new ApiError(500, "Failed to get dashboard.", error.message);
  }
});

const getRestaurantSales = asyncHandler(async (req, res) => {
  const { businessTeam } = req;
  const { year, month, restaurantId } = req.query;

  checkRequiredFields({ year, restaurantId });

  try {
    const salesData = month
      ? await getRestaurantDailySalesData({ restaurantId, year, month })
      : await getRestaurantMonthlySalesData({ restaurantId, year });

    return res
      .status(200)
      .json(
        new ApiResponse({ salesData: salesData }, "Obtained successfully.")
      );
  } catch (error) {
    throw new ApiError(500, "Failed to get restaurant sales.", error.message);
  }
});

export {
  getBusinessTeamAccount,
  loginBusinessTeam,
  registerBusinessTeam,
  logoutBusinessTeam,
  refreshAccessToken,
  deleteBusinessTeamAccount,
  updateBusinessTeamAccount,
  getDashboardData,
  getRestaurantSales,
};
