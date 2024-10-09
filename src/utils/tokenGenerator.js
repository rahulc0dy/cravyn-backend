import jwt from "jsonwebtoken";

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

export { generateAccessToken, generateRefreshToken };
