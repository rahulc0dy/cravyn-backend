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
  createBusinessTeam,
  deleteBusinessTeam,
  updateBusinessTeamNamePhoneNo,
} from "../database/queries/businessTeam.query.js";
import jwt from "jsonwebtoken";

const getBusinessTeamAccount = asyncHandler(async (req, res) => {
  if (!req.businessTeam || !req.businessTeam.id) {
    res.status(400).json(
      new ApiResponse(
        {
          reason: `req.businessTeam is ${req.businessTeam}`,
          at: "businessTeam.controller.js -> getBusinessTeamAccouont",
        },
        "Unauthorised Access."
      )
    );
  }

  const businessTeam = (
    await getNonSensitiveBusinessTeamInfoById(req.businessTeam.id)
  )[0];

  if (!businessTeam) {
    res.status(404).json(
      new ApiResponse(
        {
          reason: `BusinessTeam member not found by id`,
          at: "businessTeam.controller.js -> getBusinessTeamAccount",
        },
        "User not found."
      )
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse({ businessTeam }, "BusinessTeam obtained successfully.")
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
      return res.status(400).json(
        new ApiResponse(
          {
            reason,
            at: "businessTeam.controller.js -> loginBusinessTeam",
          },
          message
        )
      );
    }
  }

  let businessTeam = await getBusinessTeamByEmail(email);

  if (businessTeam.length <= 0) {
    return res.status(404).json(
      new ApiResponse(
        {
          reason: "No businessTeam found with given credentials",
          at: "businessTeam.controller.js -> loginBusinessTeam",
        },
        "Phone number is not registered."
      )
    );
  }
  const correctPassword = businessTeam[0].password;

  const isPasswordCorrect = await bcrypt.compare(password, correctPassword);

  if (!isPasswordCorrect) {
    return res.status(401).json(
      new ApiResponse(
        {
          reason: "Incorrect Password.",
          at: "businessTeam.controller.js -> loginBusinessTeam",
        },
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
    sameSite: "None",
  };

  delete businessTeam[0].refresh_token;
  delete businessTeam[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        {
          businessTeam: businessTeam[0],
          accessToken,
          refreshToken,
        },
        "BusinessTeam logged in successfully."
      )
    );
});

const registerBusinessTeam = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email, password, confirmPassword } = req.body;

  const requiredFields = [
    { field: name, message: "name is required.", reason: `name is ${name}` },
    {
      field: email,
      message: "email is required.",
      reason: `email is ${email}`,
    },
    {
      field: phoneNumber,
      message: "phoneNumber is required.",
      reason: `phoneNumber is ${phoneNumber}`,
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
    return res.status(400).json(
      new ApiResponse(
        {
          reason: "Passwords do not match",
          at: "businessTeam.controller.js -> registerBusinessTeam",
        },
        "Password confirmation does not match."
      )
    );
  }

  const existedBusinessTeam = await getBusinessTeamByEmail(email);

  if (existedBusinessTeam.length > 0) {
    return res.status(409).json(
      new ApiResponse(
        {
          reason: "BusinessTeam already registered",
          at: "businessTeam.controller.js -> registerBusinessTeam",
        },
        "BusinessTeam already exists."
      )
    );
  }

  let businessTeam;

  try {
    businessTeam = await createBusinessTeam(name, phoneNumber, email, password);
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "Business team creation query error",
          at: "businessTeam.controller.js -> registerBusinessTeam",
        },
        "Something went wrong while registering the businessTeam."
      )
    );
  }

  if (!businessTeam) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: "BusinessTeam is not defined",
          at: "businessTeam.controller.js -> registerBusinessTeam",
        },
        "Failed to register businessTeam."
      )
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
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message,
          at: "businessTeam.controller.js -> logoutBusinessTeam",
        },
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
        {
          reason: "Logout successful",
          at: "businessTeam.controller.js -> logoutBusinessTeam",
        },
        "BusinessTeam logged out successfully."
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json(
      new ApiResponse(
        {
          reason: "Request unauthorised",
          at: "businessTeam.controller.js -> refreshAccessToken",
        },
        "Unauthorized request."
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
        .status(401)
        .json(
          new ApiResponse(
            { reason: "Token verification failed" },
            "Invalid refresh token."
          )
        );
    }

    if (incomingRefreshToken !== businessTeam?.refresh_token) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            { reason: "Tokens do not match" },
            "Unable to reinstate session."
          )
        );
    }

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
          {
            accessToken: accessToken,
            refreshToken: newRefreshToken,
          },
          "Session is reinitialised."
        )
      );
  } catch (error) {
    res
      .status(401)
      .json(
        new ApiResponse(
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
          { ...error, reason: "Refresh token could not be verified" },
          error?.message || "Invalid request"
        )
      );
  }

  if (businessTeam.length <= 0) {
    return res
      .status(404)
      .json(
        new ApiResponse(
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
          { ...error, reason: "Unable to fetch the logged in businessTeam." },
          "Failed to delete BusinessTeam."
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
        { reason: "Deletion successful" },
        "BusinessTeam deleted out successfully."
      )
    );
});

const updateBusinessTeamAccount = asyncHandler(async (req, res) => {
  let { name, phoneNumber } = req.body;

  if (!name && !phoneNumber) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "No update details provided" },
          "Please provide details to update."
        )
      );
  }

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
    return res.status(500).json(
      new ApiResponse(
        {
          ...error,
          reason: error.message || "BusinessTeam could not be updated",
        },
        "Failed to update businessTeam details."
      )
    );
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

export {
  getBusinessTeamAccount,
  loginBusinessTeam,
  registerBusinessTeam,
  logoutBusinessTeam,
  refreshAccessToken,
  deleteBusinessTeamAccount,
  updateBusinessTeamAccount,
};
