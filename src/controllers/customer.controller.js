import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import {
  getCustomerByEmail,
  setRefreshToken,
  createCustomer,
  getCustomerById,
  deleteCustomer,
  updateCustomerNamePhoneNo,
  getNonSensitiveCustomerInfoById,
  updateCustomerImageUrl,
  getCustomerAddressesByCustomerId,
  createCustomerAddress,
  deleteCustomerAddressByAddressId,
  updateCustomerDefaultAddressByAddressId,
  getCustomerAddressByAddressId,
} from "../database/queries/customer.query.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import { uploadImageOnCloudinary } from "../utils/cloudinary.js";
import { cookieOptions } from "../constants.js";
import { checkRequiredFields } from "../utils/requiredFieldsCheck.js";

const getCustomerAccount = asyncHandler(async (req, res) => {
  if (!req.customer || !req.customer.id) {
    res
      .status(401)
      .json(
        new ApiResponse(
          { reason: `req.customer is ${req.customer}` },
          "Unauthorised Access."
        )
      );
  }

  const customer = (await getNonSensitiveCustomerInfoById(req.customer.id))[0];

  if (!customer) {
    res
      .status(404)
      .json(
        new ApiResponse(
          { reason: `Customer not found by id` },
          "User not found."
        )
      );
  }

  res
    .status(200)
    .json(new ApiResponse({ customer }, "Customer obtained successfully."));
});

const loginCustomer = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (
    !checkRequiredFields({ email, password }, ({ field, message, reason }) =>
      res.status(400).json(new ApiResponse({ reason }, message))
    )
  )
    return;

  let customer = await getCustomerByEmail(email);

  if (customer.length <= 0) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          { reason: "No customer found with given credentials" },
          "Email is not registered."
        )
      );
  }
  const correctPassword = customer[0].password;

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
  const accessToken = generateAccessToken(customer[0]);
  const refreshToken = generateRefreshToken(customer[0]);

  const customerId = customer[0].id;

  customer = await setRefreshToken(refreshToken, customerId);

  delete customer[0].refresh_token;
  delete customer[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        {
          customer: customer[0],
          user: customer[0],
          accessToken,
          refreshToken,
        },
        "User logged in successfully."
      )
    );
});

const registerCustomer = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email, dateOfBirth, password, confirmPassword } =
    req.body;

  if (
    !checkRequiredFields(
      { name, email, phoneNumber, dateOfBirth, password, confirmPassword },
      ({ field, message, reason }) =>
        res.status(400).json(new ApiResponse({ reason }, message))
    )
  )
    return;

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

  const existedCustomer = await getCustomerByEmail(email);

  if (existedCustomer.length > 0) {
    return res
      .status(409)
      .json(
        new ApiResponse(
          { reason: "Customer already registered" },
          "User already exists."
        )
      );
  }

  let customer;

  try {
    customer = await createCustomer(
      name,
      phoneNumber,
      email,
      dateOfBirth,
      password
    );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          error,
          reason: error.message || "Error at customer controller",
        },
        "Something went wrong while registering the user."
      )
    );
  }

  if (!customer) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: "Customer is not defined" },
          "Failed to register user."
        )
      );
  }

  delete customer.refresh_token;
  delete customer.profile_image_url;
  delete customer.password;

  return res
    .status(201)
    .json(new ApiResponse(customer, "Customer registered successfully."));
});

const logoutCustomer = asyncHandler(async (req, res) => {
  try {
    await setRefreshToken("NULL", req.customer.id);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          { reason: error.message || "Unable to set refresh token" },
          "Unable to fetch the logged in user."
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
        "User logged out successfully."
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

    let customer = await getCustomerById(decodedToken.id);

    customer = customer[0];

    if (!customer) {
      return res
        .status(500)
        .json(
          new ApiResponse(
            { reason: "Token verification failed" },
            "Invalid refresh token."
          )
        );
    }

    if (incomingRefreshToken !== customer?.refresh_token)
      res
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

    const accessToken = generateAccessToken(customer);
    const newRefreshToken = generateRefreshToken(customer);

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
    res.status(401).json(
      new ApiResponse(
        {
          reason:
            error.message || "Error occurred while trying to refresh token",
        },
        "Unable to refresh tokens."
      )
    );
  }
});

const deleteCustomerAccount = asyncHandler(async (req, res) => {
  const { refreshToken, password } = req.body;

  checkRequiredFields(
    { refreshToken, password },
    ({ field, message, reason }) =>
      res.status(400).json(new ApiResponse({ reason }, message))
  );

  let customer;

  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const customerId = decodedToken?.id;

    customer = await getCustomerById(customerId);

    if (customer.length === 0) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            { reason: "Invalid Refresh Token." },
            "User not found."
          )
        );
    }
  } catch (error) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          { reason: error.message || "Refresh token could not be verified" },
          "Invalid request."
        )
      );
  }

  if (customer.length <= 0) {
    return res
      .status(503)
      .json(
        new ApiResponse(
          { reason: "Unable to get customer" },
          "Email is not registered"
        )
      );
  }
  const correctPassword = customer[0].password;

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
    await deleteCustomer(customer[0].id);
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "Unable to fetch the logged in customer.",
        },
        "Failed to delete Customer"
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
        "Customer deleted out successfully."
      )
    );
});

const updateCustomerAccount = asyncHandler(async (req, res) => {
  let { name, phoneNumber } = req.body;

  const existingDetails = (
    await getNonSensitiveCustomerInfoById(req.customer.id)
  )[0];

  name = name ?? existingDetails.name;
  phoneNumber = phoneNumber ?? existingDetails.phone_number;

  let customer;
  try {
    customer = await updateCustomerNamePhoneNo(req.customer.id, {
      name,
      phoneNumber,
    });
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason: error.message || "Customer could not be updated",
        },
        "Failed to update customer details."
      )
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse({ customer: customer[0] }, "Customer details updated.")
    );
});

const updateCustomerImage = asyncHandler(async (req, res) => {
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
      const customer = await updateCustomerImageUrl(
        req.customer.id,
        cloudinaryResponse.url
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            { customer: customer[0], imageUrl: cloudinaryResponse.url },
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

const getCustomerAddresses = asyncHandler(async (req, res) => {
  const { customer } = req;
  const { isDefault } = req.query;

  const customerId = customer.id;

  if (!customer || !customerId) {
    return res.status(400).json(
      new ApiResponse(
        {
          reason:
            "Unable to retrieve customer address due to missing information.",
        },
        "We couldn't retrieve your address. Please ensure your account information is correct."
      )
    );
  }

  try {
    const address = await getCustomerAddressesByCustomerId(
      customerId,
      isDefault
    );

    if (!address || address.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            { reason: "No addresses found for the customer." },
            "You don't have any saved addresses yet."
          )
        );
    }

    return res.status(200).json(
      new ApiResponse(
        {
          address: isDefault && isDefault === true ? address[0] : address,
        },
        "Address details retrieved successfully."
      )
    );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason:
            error.message ||
            "Internal server error while retrieving addresses.",
        },
        "Something went wrong while fetching your addresses. Please try again later."
      )
    );
  }
});

const addCustomerAddress = asyncHandler(async (req, res) => {
  const { customer } = req;
  const { latitude, longitude, displayAddress, isDefault } = req.body;

  if (
    !checkRequiredFields(
      { latitude, longitude, displayAddress },
      ({ field, message, reason }) =>
        res.status(400).json(new ApiResponse({ reason }, message))
    )
  )
    return;

  const customerId = customer.id;
  if (!customer || !customerId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "Missing customer ID." },
          "We couldn't add the address. Please ensure you're logged in."
        )
      );
  }

  try {
    const address = await createCustomerAddress({
      customerId,
      latitude,
      longitude,
      displayAddress,
      isDefault: !isDefault || isDefault.length === 0 ? false : isDefault,
    });

    if (!address || address.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            { reason: "Database error while adding the address." },
            "We couldn't save your address. Please try again later."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse({ address: address[0] }, "Address added successfully.")
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason:
            error.message || "Internal server error while adding address.",
        },
        "Something went wrong. We couldn't add your address. Please try again later."
      )
    );
  }
});

const deleteCustomerAddress = asyncHandler(async (req, res) => {
  const { customer } = req;
  const { addressId } = req.body;

  const customerId = customer.id;

  if (!customer || !addressId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: { customer, customerId, addressId } },
          "We couldn't identify the address to delete. Please try again."
        )
      );
  }

  try {
    const existingAddress = await getCustomerAddressByAddressId(addressId);

    if (existingAddress.is_default) {
      return res.status(403).json(
        new ApiResponse(
          {
            reason: "Default address cannot be deleted without a replacement.",
          },
          "You cannot delete your default address. Please set another default address first."
        )
      );
    }

    const address = await deleteCustomerAddressByAddressId(addressId);

    if (!address || address.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            { reason: "Error in database operation while deleting address." },
            "We couldn't delete your address. Please try again later."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          { address: address[0] },
          "Address deleted successfully."
        )
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason:
            error.message || "Internal server error while deleting address.",
        },
        "Something went wrong. We couldn't delete your address. Please try again later."
      )
    );
  }
});

const setCustomerDefaultAddress = asyncHandler(async (req, res) => {
  const { customer } = req;
  const { addressId } = req.body;

  if (!customer || !addressId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          { reason: "Missing customer or address ID." },
          "We couldn't set your default address. Please try again."
        )
      );
  }

  try {
    const address = await updateCustomerDefaultAddressByAddressId(addressId);

    if (!address || address.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            { reason: "Database error while updating default address." },
            "We couldn't set your default address. Please try again later."
          )
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          { address: address[0] },
          "Default address updated successfully."
        )
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        {
          reason:
            error.message ||
            "Internal server error while setting default address.",
        },
        "Something went wrong. We couldn't set your default address. Please try again later."
      )
    );
  }
});

export {
  getCustomerAccount,
  loginCustomer,
  registerCustomer,
  logoutCustomer,
  refreshAccessToken,
  deleteCustomerAccount,
  updateCustomerAccount,
  updateCustomerImage,
  getCustomerAddresses,
  addCustomerAddress,
  deleteCustomerAddress,
  setCustomerDefaultAddress,
};
