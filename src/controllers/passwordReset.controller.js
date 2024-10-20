import { sendMail } from "../utils/nodemailer.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  getCustomerByEmail,
  updateCustomerPassword,
} from "../db/customer.query.js";
import {
  getDeliveryPartnerByEmail,
  updateDeliveryPartnerPassword,
} from "../db/deliveryPartner.query.js";
import {
  getRestaurantOwnerByEmail,
  updateRestaurantOwnerPassword,
} from "../db/restaurantOwner.query.js";
import { totp } from "otplib";
import { getOtp, storeOtp } from "../db/otp.query.js";
import bcrypt from "bcrypt";

const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const userType = req.query?.userType;

  if (!email || !userType) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          reason: email ? `userType is ${userType}` : `email is ${email}`,
          at: "passwordReset.controller.js",
        },
        "Email cannot be empty."
      )
    );
  }

  let user;
  switch (userType) {
    case "customer":
      user = (await getCustomerByEmail(email))[0];
      break;
    case "deliveryPartner":
      user = (await getDeliveryPartnerByEmail(email))[0];
      break;
    case "restaurantOwner":
      user = (await getRestaurantOwnerByEmail(email))[0];
      break;
    default:
      break;
  }

  if (!user) {
    return res.status(404).json(
      new ApiResponse(
        404,
        {
          reason: "User does not exist",
          at: "passwordReset.controller.js -> forgotPassword",
        },
        "No user found associated with this email."
      )
    );
  }

  totp.options = {
    digits: 4,
  };

  const token = totp.generate(process.env.OTP_SECRET);

  const otpHash = await bcrypt.hash(token, 10);

  try {
    user = await storeOtp(userType, user.id, otpHash);

    const mailResponse = await sendMail(email, token);
    return res
      .status(250)
      .json(
        new ApiResponse(
          250,
          { mailResponse, user: user[0] },
          "The OTP has been sent to your email."
        )
      );
  } catch (error) {
    return res.status(503).json(
      new ApiResponse(
        503,
        {
          reason: error.message || "error sending email",
          at: "passwordReset.controller.js -> nodemailer.js",
        },
        "An error occurred while sending the email, please try again."
      )
    );
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { otp, email } = req.body;
  const userType = req.query?.userType;

  const requiredFields = [
    {
      field: email,
      message: "Email is required.",
      reason: "Email is not defined",
    },
    {
      field: otp,
      message: "OTP is required.",
      reason: "OTP is not defined",
    },
  ];

  for (const { field, message, reason } of requiredFields) {
    if (!field) {
      return res.status(400).json(new ApiResponse(400, { reason }, message));
    }
  }

  if (!userType) {
    return res.status(400).json(
      new ApiResponse(
        400,
        {
          reason: `userType is ${userType}`,
          at: "passwordReset.controller.js -> verifyOtp",
        },
        "User type is missing."
      )
    );
  }

  const hashedOtp = (await getOtp(userType, email))[0].otp;
  const isOtpCorrect = await bcrypt.compare(otp, hashedOtp);

  if (!isOtpCorrect) {
    return res.status(400).json(
      new ApiResponse(
        400,
        {
          reason: "Incorrect otp",
          at: "passwordReset.controller.js -> verifyOtp",
        },
        "OTP is incorrect."
      )
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP verified successfully."));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { otp, password, confirmPassword, email } = req.body;
  const userType = req.query?.userType;

  if (password !== confirmPassword) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          reason: "Passwords do not match",
          at: "passwordReset.controller.js -> resetPassword",
        },
        "Passwords do not match."
      )
    );
  } else if (!otp || !userType) {
    return res.status(400).json(
      new ApiResponse(
        400,
        {
          reason: userType ? `otp is ${otp}` : `userType is ${userType}`,
          at: "passwordReset.controller.js -> resetPassword",
        },
        "Please enter OTP."
      )
    );
  }

  const hashedOtp = (await getOtp(userType, email))[0].otp;
  const isOtpCorrect = await bcrypt.compare(otp, hashedOtp);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    if (!isOtpCorrect) {
      return res.status(400).json(
        new ApiResponse(
          400,
          {
            reason: "Incorrect otp",
            at: "passwordReset.controller.js -> resetPassword",
          },
          "Incorrect OTP, please try again."
        )
      );
    }

    let user;

    switch (userType) {
      case "customer":
        user = await updateCustomerPassword(email, passwordHash);
        break;
      case "deliveryPartner":
        user = await updateDeliveryPartnerPassword(email, passwordHash);
        break;
      case "restaurantOwner":
        user = await updateRestaurantOwnerPassword(email, passwordHash);
        break;
      default:
        break;
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { user }, "Password updated successfully."));
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,
        {
          reason: error.message || "Failed",
          at: "passwordReset.controller.js -> resetPassword",
        },
        "An error occurred while updating password, please try again."
      )
    );
  }
});

export { forgotPassword, verifyOtp, resetPassword };
