import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import {
  getDeliveryPartnerByEmail,
  setRefreshToken,
  createDeliveryPartner,
  getDeliveryPartnerById,
  deleteDeliveryPartner,
  getNonSensitiveDeliveryPartnerInfoById,
  updateDeliveryPartnerImageUrl,
  updateDeliveryPartnerNamePhoneNoVehicleAvailability,
} from "../db/deliveryPartner.query.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import { uploadImageOnCloudinary } from "../utils/cloudinary.js";

const getDeliveryPartnerAccount = asyncHandler(async (req, res) => {
  if (!req.deliveryPartner || !req.deliveryPartner.id) {
    res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: `req.deliveryPartner is ${req.deliveryPartner}` },
          "Unauthorised Access."
        )
      );
  }

  const deliveryPartner = (
    await getNonSensitiveDeliveryPartnerInfoById(req.deliveryPartner.id)
  )[0];

  if (!deliveryPartner) {
    res
      .status(404)
      .json(
        new ApiResponse(
          404,
          { reason: `DeliveryPartner not found by id` },
          "User not found."
        )
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deliveryPartner },
        "Delivery partner obtained successfully."
      )
    );
});

const loginDeliveryPartner = asyncHandler(async (req, res) => {
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

  let deliveryPartner = await getDeliveryPartnerByEmail(email);

  if (deliveryPartner.length <= 0) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          { reason: "No deliveryPartner found with given credentials" },
          "Email is not registered."
        )
      );
  }
  const correctPassword = deliveryPartner[0].password;

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
  const accessToken = generateAccessToken(deliveryPartner[0]);
  const refreshToken = generateRefreshToken(deliveryPartner[0]);

  const deliveryPartnerId = deliveryPartner[0].id;

  deliveryPartner = await setRefreshToken(refreshToken, deliveryPartnerId);

  const options = {
    httpOnly: true,
    secure: true,
  };

  delete deliveryPartner[0].refresh_token;
  delete deliveryPartner[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          deliveryPartner: deliveryPartner[0],
          accessToken,
          refreshToken,
        },
        "Delivery partner logged in successfully."
      )
    );
});

const registerDeliveryPartner = asyncHandler(async (req, res) => {
  const {
    name,
    phoneNumber,
    email,
    vehicleType,
    availability,
    password,
    confirmPassword,
  } = req.body;

  const requiredFields = [
    { field: name, message: "name is required.", reason: `name is ${name}` },
    {
      field: email,
      message: "email is required.",
      reason: `email is ${email}`,
    },
    {
      field: phoneNumber,
      message: "Phone number is required.",
      reason: `phoneNumber is ${phoneNumber}`,
    },
    {
      field: phoneNumber,
      message: "Phone number is required.",
      reason: `phoneNumber is ${phoneNumber}`,
    },
    {
      field: vehicleType,
      message: "Vehicle type is required.",
      reason: `vehicleType is ${vehicleType}`,
    },
    {
      field: availability,
      message: "availability is required.",
      reason: `availability is ${availability}`,
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

  const existedDeliveryPartner = await getDeliveryPartnerByEmail(email);

  if (existedDeliveryPartner.length > 0) {
    return res
      .status(409)
      .json(
        new ApiResponse(
          409,
          { reason: "DeliveryPartner already registered" },
          "Delivery partner account already exists."
        )
      );
  }

  let deliveryPartner;

  try {
    deliveryPartner = await createDeliveryPartner({
      name,
      phoneNumber,
      email,
      vehicleType,
      availability,
      password,
    });
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          error,
          reason: error.message || "Error at delivery partner controller",
        },
        "Something went wrong while registering the delivery partner."
      )
    );
  }

  if (!deliveryPartner) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { reason: "DeliveryPartner is not defined" },
          "Failed to register delivery partner."
        )
      );
  }

  delete deliveryPartner.refresh_token;
  delete deliveryPartner.profile_image_url;
  delete deliveryPartner.password;

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        deliveryPartner,
        "Delivery partner registered successfully."
      )
    );
});

const logoutDeliveryPartner = asyncHandler(async (req, res) => {
  try {
    await setRefreshToken("NULL", req.deliveryPartner.id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error },
          "Unable to fetch the logged in delivery partner."
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
        "Delivery partner logged out successfully."
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    res
      .status(401)
      .json(
        ApiResponse(
          401,
          { reason: "Request unauthorised" },
          "Unauthorized request."
        )
      );
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    let deliveryPartner = await getDeliveryPartnerById(decodedToken.id);

    deliveryPartner = deliveryPartner[0];

    if (!deliveryPartner) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { reason: "Token verification failed" },
            "Invalid refresh token."
          )
        );
    }

    if (incomingRefreshToken !== deliveryPartner?.refresh_token)
      res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { reason: "Tokens do not match" },
            "Unable to reinstate session."
          )
        );

    const options = {
      httpOnly: true,
      secure: true,
    };

    const accessToken = generateAccessToken(deliveryPartner);
    const newRefreshToken = generateRefreshToken(deliveryPartner);

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
          "Session is reinitialised."
        )
      );
  } catch (error) {
    res.status(401).json(
      new ApiResponse(
        401,
        {
          reason:
            error?.message || "Error occured while trying to refresh token",
        },
        "Invalid refresh token."
      )
    );
  }
});

const deleteDeliveryPartnerAccount = asyncHandler(async (req, res) => {
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
  let deliveryPartner;

  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const deliveryPartnerId = decodedToken?.id;

    deliveryPartner = await getDeliveryPartnerById(deliveryPartnerId);

    if (deliveryPartner.length === 0) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            { reason: "Invalid Refresh Token." },
            "Delivery partner account not found."
          )
        );
    }
  } catch (error) {
    return res.status(401).json(
      new ApiResponse(
        401,
        {
          reason: error?.message || "Refresh token could not be verified",
        },
        "Invalid request."
      )
    );
  }

  if (deliveryPartner.length <= 0) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          { reason: "Unable to get deliveryPartner" },
          "Email is not registered."
        )
      );
  }
  const correctPassword = deliveryPartner[0].password;

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
    await deleteDeliveryPartner(deliveryPartner[0].id);
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          reason:
            error.message || "Unable to fetch the logged in deliveryPartner.",
        },
        "Failed to delete Delivery partner."
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
        "Delivery partner deleted out successfully."
      )
    );
});

const updateDeliveryPartnerAccount = asyncHandler(async (req, res) => {
  let { name, phoneNumber, vehicleType, availability } = req.body;

  const existingDetails = (
    await getNonSensitiveDeliveryPartnerInfoById(req.deliveryPartner.id)
  )[0];

  name = name ?? existingDetails.name;
  phoneNumber = phoneNumber ?? existingDetails.phone_number;
  vehicleType = vehicleType ?? existingDetails.vehicle_type;
  availability = availability ?? existingDetails.availability;

  let deliveryPartner;
  try {
    deliveryPartner = await updateDeliveryPartnerNamePhoneNoVehicleAvailability(
      req.deliveryPartner.id,
      {
        name,
        phoneNumber,
        vehicleType,
        availability,
      }
    );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          reason: error.message || "DeliveryPartner could not be updated",
        },
        "Failed to update deliveryPartner details."
      )
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deliveryPartner: deliveryPartner[0] },
        "Delivery partner details updated."
      )
    );
});

const updateDeliveryPartnerImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            { reason: `The file passed is ${req.file}` },
            "No image file uploaded."
          )
        );
    }

    const localFilePath = req.file.path;

    const cloudinaryResponse = await uploadImageOnCloudinary(localFilePath);

    if (cloudinaryResponse.url) {
      const deliveryPartner = await updateDeliveryPartnerImageUrl(
        req.deliveryPartner.id,
        cloudinaryResponse.url
      );

      res.status(200).json(
        new ApiResponse(
          200,
          {
            deliveryPartner: deliveryPartner[0],
            imageUrl: cloudinaryResponse.url,
          },
          "Image uploaded successfully."
        )
      );
    } else {
      throw new Error("Failed to upload image to Cloudinary.");
    }
  } catch (error) {
    res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { reason: error.message || "Image could not be uploaded" },
          error.message || "Internal server error."
        )
      );
  } finally {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

export {
  getDeliveryPartnerAccount,
  loginDeliveryPartner,
  registerDeliveryPartner,
  logoutDeliveryPartner,
  refreshAccessToken,
  deleteDeliveryPartnerAccount,
  updateDeliveryPartnerAccount,
  updateDeliveryPartnerImage,
};
