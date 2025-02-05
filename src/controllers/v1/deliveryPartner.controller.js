import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/tokenGenerator.js";
import {
  createDeliveryPartner,
  deleteDeliveryPartner,
  getDeliveryPartnerByEmail,
  getDeliveryPartnerById,
  getNonSensitiveDeliveryPartnerInfoById,
  setRefreshToken,
  updateDeliveryPartnerImageUrl,
  updateDeliveryPartnerNamePhoneNoVehicleAvailability,
} from "../../database/v1/queries/deliveryPartner.query.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import { uploadImageOnCloudinary } from "../../utils/cloudinary.js";
import { cookieOptions } from "../../constants/cookieOptions.js";
import { checkRequiredFields } from "../../utils/requiredFieldsCheck.js";

const getDeliveryPartnerAccount = asyncHandler(async (req, res) => {
  if (!req.deliveryPartner || !req.deliveryPartner.id) {
    res
      .status(401)
      .json(
        new ApiResponse(
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
          { reason: `DeliveryPartner not found by id` },
          "User not found."
        )
      );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        { deliveryPartner },
        "Delivery partner obtained successfully."
      )
    );
});

const loginDeliveryPartner = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  checkRequiredFields({ email, password });

  let deliveryPartner = await getDeliveryPartnerByEmail(email);

  if (deliveryPartner.length <= 0) {
    return res
      .status(404)
      .json(
        new ApiResponse(
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
          { reason: "Incorrect Password." },
          "Invalid credentials, please try again."
        )
      );
  }
  const accessToken = generateAccessToken(deliveryPartner[0]);
  const refreshToken = generateRefreshToken(deliveryPartner[0]);

  const deliveryPartnerId = deliveryPartner[0].id;

  deliveryPartner = await setRefreshToken(refreshToken, deliveryPartnerId);

  delete deliveryPartner[0].refresh_token;
  delete deliveryPartner[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
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

  checkRequiredFields({
    name,
    email,
    phoneNumber,
    vehicleType,
    password,
    confirmPassword,
  });

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

  const existedDeliveryPartner = await getDeliveryPartnerByEmail(email);

  if (existedDeliveryPartner.length > 0) {
    return res
      .status(409)
      .json(
        new ApiResponse(
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
      availability: availability || false,
      password,
    });
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
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
          { reason: "DeliveryPartner is not defined" },
          "Failed to register delivery partner."
        )
      );
  }

  delete deliveryPartner.refresh_token;
  delete deliveryPartner.profile_image_url;
  delete deliveryPartner.password;

  return res.status(201).json(
    new ApiResponse(
      {
        deliveryPartner,
        user: deliveryPartner,
      },
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
          { ...error },
          "Unable to fetch the logged in delivery partner."
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
        "Delivery partner logged out successfully."
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
            { reason: "Token verification failed" },
            "Invalid refresh token."
          )
        );
    }

    if (incomingRefreshToken !== deliveryPartner?.refresh_token)
      return res
        .status(401)
        .json(
          new ApiResponse(
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
  } catch (error) {
    return res.status(401).json(
      new ApiResponse(
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
      return res.status(400).json(new ApiResponse({ reason }, message));
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
            { reason: "Invalid Refresh Token." },
            "Delivery partner account not found."
          )
        );
    }
  } catch (error) {
    return res.status(401).json(
      new ApiResponse(
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
        {
          reason:
            error.message || "Unable to fetch the logged in deliveryPartner.",
        },
        "Failed to delete Delivery partner."
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
        {
          reason: error.message || "DeliveryPartner could not be updated",
        },
        "Failed to update deliveryPartner details."
      )
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
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

      return res.status(200).json(
        new ApiResponse(
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
    return res
      .status(500)
      .json(
        new ApiResponse(
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
