import { sendMail } from "../utils/nodemailer.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  getCustomerByEmail,
  updateCustomerPassword,
} from "../database/queries/customer.query.js";
import {
  getDeliveryPartnerByEmail,
  updateDeliveryPartnerPassword,
} from "../database/queries/deliveryPartner.query.js";
import {
  getRestaurantOwnerByEmail,
  updateRestaurantOwnerPassword,
} from "../database/queries/restaurantOwner.query.js";
import { totp } from "otplib";
import { getOtp, storeOtp } from "../database/queries/otp.query.js";
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
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          { reason: "User does not exist", at: "passwordReset.controller.js" },
          "User with this email does not exist."
        )
      );
  }

  totp.options = {
    digits: 6,
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
          "OTP sent to your email."
        )
      );
  } catch (error) {
    return res.status(503).json(
      new ApiResponse(
        503,
        {
          reason: error.message || "error sending email",
          at: "passwordReset.controller.js > nodemailer.js",
        },
        "Email could not be sent."
      )
    );
  }
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
  const otpCorrect = await bcrypt.compare(otp, hashedOtp);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    if (!otpCorrect) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            { reason: "Incorrect otp", at: "passwordreset" },
            "OTP is incorrect."
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
          at: "passwordReset.controller.js->resetPassword",
        },
        "Failed to update password."
      )
    );
  }
});

export { forgotPassword, resetPassword };
