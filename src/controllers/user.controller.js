import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sql } from "../db/database.js";

const loginUser = asyncHandler(async (req, res) => {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Phone number is required."));
  }

  if (!password) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Password is required."));
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, phoneNumber, email, dateOfBirth, password, confirmPassword } =
    req.body;

  console.log(dateOfBirth);

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

  console.log(existedUser);

  if (existedUser.length > 0) {
    return res
      .status(409)
      .json(new ApiResponse(409, {}, "User already exists."));
  }

  // Format date if needed (e.g., as 'YYYY-MM-DD')
  const formattedDateOfBirth = new Date(dateOfBirth)
    .toISOString()
    .split("T")[0];

  // Insert new user into the database
  var user;

  try {
    user = await sql`
         INSERT INTO Customer (name, phone_number, email_address, date_of_birth, refresh_token, profile_image_url, password)
         VALUES (${name}, ${phoneNumber}, ${email}, ${formattedDateOfBirth}, 'some_refresh_token', 'www.cloudinary.com/Souvik', ${password})
         RETURNING *;
       `;
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

  return res
    .status(201)
    .json(new ApiResponse(200, user, "User registered successfully."));
});

export { loginUser, registerUser };
