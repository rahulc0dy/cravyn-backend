import jwt from "jsonwebtoken";

/**
 * Generates an access token for a user.
 *
 * @param {Object} user - The user object.
 * @param {string} user.id - The user's unique identifier.
 * @param {string} user.email - The user's email address.
 * @param {string} user.name - The user's name.
 * @returns {string} - The generated JWT access token.
 */
const generateAccessToken = function (user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
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
 * @param {Object} user - The user object.
 * @param {string} user.id - The user's unique identifier.
 * @returns {string} - The generated JWT refresh token.
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
