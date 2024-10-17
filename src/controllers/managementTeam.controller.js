import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import {
  getManagementTeamById,
  getManagementTeamByEmail,
  getNonSensitiveManagementTeamInfoById,
  setRefreshToken,
  createManagementTeam,
  deleteManagementTeam,
  updateManagementTeamNamePhoneNo,
} from "../db/managementTeam.query.js";
import jwt from "jsonwebtoken";

const getManagementTeamAccount = asyncHandler(async (req, res) => {
  if (!req.managementTeam || !req.managementTeam.id) {
    res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: `req.managementTeam is ${req.managementTeam}` },
          "Unauthorised Access."
        )
      );
  }

  const managementTeam = (
    await getNonSensitiveManagementTeamInfoById(req.managementTeam.id)
  )[0];

  if (!managementTeam) {
    res
      .status(404)
      .json(
        new ApiResponse(
          404,
          { reason: `ManagementTeam not found by id` },
          "User not found."
        )
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { managementTeam },
        "ManagementTeam obtained successfully"
      )
    );
});

const loginManagementTeam = asyncHandler(async (req, res) => {
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

  let managementTeam = await getManagementTeamByEmail(email);

  if (managementTeam.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          401,
          { reason: "No managementTeam found with given credentials" },
          "Phone number is not registered."
        )
      );
  }
  const correctPassword = managementTeam[0].password;

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
  const accessToken = generateAccessToken(managementTeam[0]);
  const refreshToken = generateRefreshToken(managementTeam[0]);

  const managementTeamId = managementTeam[0].id;

  managementTeam = await setRefreshToken(refreshToken, managementTeamId);

  const options = {
    httpOnly: true,
    secure: true,
  };

  delete managementTeam[0].refresh_token;
  delete managementTeam[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          managementTeam: managementTeam[0],
          accessToken,
          refreshToken,
        },
        "ManagementTeam logged in successfully."
      )
    );
});

const registerManagementTeam = asyncHandler(async (req, res) => {
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

  const existedManagementTeam = await getManagementTeamByEmail(email);

  if (existedManagementTeam.length > 0) {
    return res
      .status(409)
      .json(
        new ApiResponse(
          409,
          { reason: "ManagementTeam already registered" },
          "ManagementTeam already exists."
        )
      );
  }

  let managementTeam;

  try {
    managementTeam = await createManagementTeam(
      name,
      phoneNumber,
      email,
      password
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { reason: error.message || "Management team creation query error" },
          "Something went wrong while registering the managementTeam."
        )
      );
  }

  if (!managementTeam) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { reason: "ManagementTeam is not defined" },
          "Failed to register managementTeam"
        )
      );
  }

  delete managementTeam.refresh_token;
  delete managementTeam.profile_image_url;
  delete managementTeam.password;

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        managementTeam,
        "ManagementTeam registered successfully."
      )
    );
});

const logoutManagementTeam = asyncHandler(async (req, res) => {
  try {
    await setRefreshToken("NULL", req.managementTeam.id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error },
          "Unable to fetch the logged in managementTeam."
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
        "ManagementTeam logged out successfully."
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

    let managementTeam = await getManagementTeamById(decodedToken.id);

    managementTeam = managementTeam[0];

    if (!managementTeam) {
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

    if (incomingRefreshToken !== managementTeam?.refresh_token)
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

    const accessToken = generateAccessToken(managementTeam);
    const newRefreshToken = generateRefreshToken(managementTeam);

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

const deleteManagementTeamAccount = asyncHandler(async (req, res) => {
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
  let managementTeam;

  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const managementTeamId = decodedToken?.id;

    managementTeam = await getManagementTeamById(managementTeamId);

    if (managementTeam.length === 0) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { reason: "Invalid Refresh Token." },
            "ManagementTeam not found"
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

  if (managementTeam.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          401,
          { reason: "Unable to get managementTeam" },
          "Phone number is not registered"
        )
      );
  }
  const correctPassword = managementTeam[0].password;

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
    await deleteManagementTeam(managementTeam[0].id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error, reason: "Unable to fetch the logged in managementTeam." },
          "Failed to delete ManagementTeam"
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
        "ManagementTeam deleted out successfully."
      )
    );
});

const updateManagementTeamAccount = asyncHandler(async (req, res) => {
  let { name, phoneNumber } = req.body;

  if (!name && !phoneNumber) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          { reason: "No update details provided" },
          "Please provide details to update"
        )
      );
  }

  const existingDetails = (
    await getNonSensitiveManagementTeamInfoById(req.managementTeam.id)
  )[0];

  name = name ?? existingDetails.name;
  phoneNumber = phoneNumber ?? existingDetails.phone_number;

  let managementTeam;
  try {
    managementTeam = await updateManagementTeamNamePhoneNo(
      req.managementTeam.id,
      {
        name,
        phoneNumber,
      }
    );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          ...error,
          reason: error.message || "ManagementTeam could not be updated",
        },
        "Failed to update managementTeam details."
      )
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { managementTeam: managementTeam[0] },
        "ManagementTeam details updated."
      )
    );
});

export {
  getManagementTeamAccount,
  loginManagementTeam,
  registerManagementTeam,
  logoutManagementTeam,
  refreshAccessToken,
  deleteManagementTeamAccount,
  updateManagementTeamAccount,
};
