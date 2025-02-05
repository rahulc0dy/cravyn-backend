import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/tokenGenerator.js";
import {
  createManagementTeam,
  deleteManagementTeam,
  getManagementTeamByEmail,
  getManagementTeamById,
  getNonSensitiveManagementTeamInfoById,
  setRefreshToken,
  updateManagementTeamNamePhoneNo,
} from "../../database/v1/queries/managementTeam.query.js";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../../constants.js";
import { checkRequiredFields } from "../../utils/requiredFieldsCheck.js";

const getManagementTeamAccount = asyncHandler(async (req, res) => {
  if (!req.managementTeam || !req.managementTeam.id) {
    res
      .status(401)
      .json(
        new ApiResponse(
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
          { reason: `ManagementTeam not found by id` },
          "User not found."
        )
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        { managementTeam },
        "ManagementTeam obtained successfully"
      )
    );
});

const loginManagementTeam = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  checkRequiredFields({ email, password });

  let managementTeam = await getManagementTeamByEmail(email);

  if (managementTeam.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          { reason: "No managementTeam found with given credentials" },
          "Email is not registered."
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
          { reason: "Incorrect Password." },
          "Invalid credentials, please try again."
        )
      );
  }
  const accessToken = generateAccessToken(managementTeam[0]);
  const refreshToken = generateRefreshToken(managementTeam[0]);

  const managementTeamId = managementTeam[0].id;

  managementTeam = await setRefreshToken(refreshToken, managementTeamId);

  delete managementTeam[0].refresh_token;
  delete managementTeam[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        {
          user: managementTeam[0],
        },
        "ManagementTeam logged in successfully."
      )
    );
});

const registerManagementTeam = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email, password, confirmPassword } = req.body;

  checkRequiredFields({ name, email, phoneNumber, password, confirmPassword });

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json(
        new ApiResponse(
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
      new ApiResponse(managementTeam, "ManagementTeam registered successfully.")
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
          { ...error },
          "Unable to fetch the logged in managementTeam."
        )
      );
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(
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
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
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
      return res.status(400).json(new ApiResponse({ reason }, message));
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
          { ...error, reason: "Unable to fetch the logged in managementTeam." },
          "Failed to delete ManagementTeam"
        )
      );
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(
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
