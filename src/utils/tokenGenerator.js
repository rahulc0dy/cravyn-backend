import jwt from "jsonwebtoken";

/**
 * Generates an access token for a user.
 *
 * @function generateAccessToken
 * @param {Object} user - The user object containing user details.
 * @param {string} user.id - The unique identifier for the user.
 * @param {string} user.email_address - The user's email address.
 * @param {string} user.phone_number - The user's phone number.
 * @param {string} user.name - The user's name.
 * @returns {string} The generated access token.
 *
 * @throws {Error} Throws an error if token generation fails.
 *
 * @example
 * const token = generateAccessToken(user);
 * console.log(token); // Outputs the generated access token.
 */
const generateAccessToken = function (user) {
  return jwt.sign(
    {
      id: user.id,
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

/**
 * Generates a refresh token for a user.
 *
 * @function generateRefreshToken
 * @param {Object} user - The user object containing user details.
 * @param {string} user.id - The unique identifier for the user.
 * @returns {string} The generated refresh token.
 *
 * @throws {Error} Throws an error if token generation fails.
 *
 * @example
 * const refreshToken = generateRefreshToken(user);
 * console.log(refreshToken); // Outputs the generated refresh token.
 */
const generateRefreshToken = function (user) {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export { generateAccessToken, generateRefreshToken };
