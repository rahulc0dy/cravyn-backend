import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import {
  getBusinessTeamById,
  getBusinessTeamByEmail,
  getNonSensitiveBusinessTeamInfoById,
  setRefreshToken,
  deleteBusinessTeam,
} from "../db/businessTeam.query.js";
import jwt from "jsonwebtoken";

const getBusinessTeamAccount = asyncHandler(async (req, res) => {
  if (!req.businessTeam || !req.businessTeam.id) {
    res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: `req.businessTeam is ${req.businessTeam}` },
          "Unauthorised Access."
        )
      );
  }

  const businessTeam = (
    await getNonSensitiveBusinessTeamInfoById(req.businessTeam.id)
  )[0];

  if (!businessTeam) {
    res
      .status(404)
      .json(
        new ApiResponse(
          404,
          { reason: `BusinessTeam member not found by id` },
          "User not found."
        )
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { businessTeam },
        "BusinessTeam obtained successfully"
      )
    );
});

const loginBusinessTeam = asyncHandler(async (req, res) => {
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

  let businessTeam = await getBusinessTeamByEmail(email);

  if (businessTeam.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          401,
          { reason: "No businessTeam found with given credentials" },
          "Phone number is not registered."
        )
      );
  }
  const correctPassword = businessTeam[0].password;

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
  const accessToken = generateAccessToken(businessTeam[0]);
  const refreshToken = generateRefreshToken(businessTeam[0]);

  const businessTeamId = businessTeam[0].id;

  businessTeam = await setRefreshToken(refreshToken, businessTeamId);

  const options = {
    httpOnly: true,
    secure: true,
  };

  delete businessTeam[0].refresh_token;
  delete businessTeam[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          businessTeam: businessTeam[0],
          accessToken,
          refreshToken,
        },
        "BusinessTeam logged in successfully."
      )
    );
});

const logoutBusinessTeam = asyncHandler(async (req, res) => {
  try {
    await setRefreshToken("NULL", req.businessTeam.id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error },
          "Unable to fetch the logged in businessTeam."
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
        "BusinessTeam logged out successfully."
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res
      .status(401)
      .json(
        new ApiResponse(
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

    let businessTeam = await getBusinessTeamById(decodedToken.id);

    businessTeam = businessTeam[0];

    if (!businessTeam) {
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

    if (incomingRefreshToken !== businessTeam?.refresh_token)
      return res
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

    const accessToken = generateAccessToken(businessTeam);
    const newRefreshToken = generateRefreshToken(businessTeam);

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

const deleteBusinessTeamAccount = asyncHandler(async (req, res) => {
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
  let businessTeam;

  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const businessTeamId = decodedToken?.id;

    businessTeam = await getBusinessTeamById(businessTeamId);

    if (businessTeam.length === 0) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { reason: "Invalid Refresh Token." },
            "BusinessTeam not found"
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

  if (businessTeam.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          401,
          { reason: "Unable to get businessTeam" },
          "Phone number is not registered"
        )
      );
  }
  const correctPassword = businessTeam[0].password;

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
    await deleteBusinessTeam(businessTeam[0].id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error, reason: "Unable to fetch the logged in businessTeam." },
          "Failed to delete BusinessTeam"
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
        "BusinessTeam deleted out successfully."
      )
    );
});

export {
  getBusinessTeamAccount,
  loginBusinessTeam,
  logoutBusinessTeam,
  refreshAccessToken,
  deleteBusinessTeamAccount,
};
