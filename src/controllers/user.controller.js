import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sql } from "../db/database.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const generateAccessToken = function (user) {
  return jwt.sign(
    {
      id: user.customer_id,
      email: user.email_address,
      phone: user.phone_number,
      name: user.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

const generateRefreshToken = function (user) {
  return jwt.sign(
    {
      id: user.customer_id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const loginUser = asyncHandler(async (req, res) => {
  const { phoneNumber, password } = req.body;

  const requiredFields = [
    { field: phoneNumber, message: "Phone Number is required." },
    { field: password, message: "Password is required." },
  ];

  for (const { field, message } of requiredFields) {
    if (!field) {
      return res.status(400).json(new ApiResponse(400, {}, message));
    }
  }

  var user =
    await sql`SELECT * FROM Customer WHERE phone_number = ${phoneNumber};`;

  const correctPassword = user[0].password;

  const isPasswordCorrect = await bcrypt.compare(password, correctPassword);

  if (!isPasswordCorrect) {
    return res
      .status(401)
      .json(new ApiResponse(401, {}, "Invalid credentials, please try again."));
  }

  const accessToken = generateAccessToken(user[0]);
  const refreshToken = generateRefreshToken(user[0]);

  const customerId = user[0].customer_id;

  user = await sql`
    UPDATE Customer
    SET refresh_token = ${refreshToken}
    WHERE customer_id = ${customerId}
    RETURNING *;
  `;

  const options = {
    httpOnly: true,
    secure: true,
  };

  delete user[0].refresh_token;
  delete user[0].password;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: user[0],
          accessToken,
          refreshToken,
        },
        "User logged in successfully."
      )
    );
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email, dateOfBirth, password, confirmPassword } =
    req.body;

  const requiredFields = [
    { field: name, message: "Name is required." },
    { field: phoneNumber, message: "Phone Number is required." },
    { field: dateOfBirth, message: "Date of birth is required." },
    { field: password, message: "Password is required." },
    { field: confirmPassword, message: "Confirm password is required." },
  ];

  for (const { field, message } of requiredFields) {
    if (!field) {
      return res.status(400).json(new ApiResponse(400, {}, message));
    }
  }

  const existedUser =
    await sql`SELECT * FROM Customer WHERE phone_number = ${phoneNumber};`;

  if (existedUser.length > 0) {
    return res
      .status(409)
      .json(new ApiResponse(409, {}, "User already exists."));
  }

  // Format date if needed (e.g., as 'YYYY-MM-DD')
  const formattedDateOfBirth = new Date(dateOfBirth)
    .toISOString()
    .split("T")[0];

  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert new user into the database
  var user;

  try {
    user = await sql`
      INSERT INTO Customer (name, phone_number, email_address, date_of_birth, password)
      VALUES (${name}, ${phoneNumber}, ${email}, ${formattedDateOfBirth}, ${hashedPassword})
      RETURNING *;
    `;
    user = user[0];
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error },
          "Something went wrong while registering the user."
        )
      );
  }

  if (!user) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          {},
          "Something went wrong while registering the user."
        )
      );
  }

  delete user.refresh_token;
  delete user.profile_image_url;
  delete user.password;

  return res
    .status(201)
    .json(new ApiResponse(200, user, "User registered successfully."));
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await sql`
      UPDATE Customer
      SET refresh_token = NULL
      WHERE customer_id = ${req.user.customer_id}
      RETURNING *;
    `;
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { ...error },
          "Unable to fetch the logged in user."
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
    .json(new ApiResponse(200, {}, "User logged out successfully."));
});

export { loginUser, registerUser, logoutUser };
