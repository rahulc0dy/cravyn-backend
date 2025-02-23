import jwt from "jsonwebtoken";
import { asyncHandler } from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import { STATUS } from "../../constants/statusCodes.js";
import { prisma } from "../../utils/prismaClient.js";

/**
 * Middleware to verify JWT token and authenticate the user.
 * It checks for a valid token in the request cookies or Authorization header.
 */
export const verifyUserJwt = asyncHandler(async (req, res, next) => {
  // Extract token from cookies or Authorization header
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  // If no token is found, return an unauthorized error
  if (!token) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.UNAUTHORIZED,
      "Authorization token is required."
    );
  }

  // Verify the token and decode its payload
  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const userId = decodedToken?.id;

  // Fetch the user from the database using the decoded user ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // If user does not exist, return an unauthorized error
  if (!user) {
    throw new ApiError(
      STATUS.CLIENT_ERROR.UNAUTHORIZED,
      "Invalid or expired token. Authentication failed."
    );
  }

  // Attach the authenticated user to the request object
  req.user = user;

  // Proceed to the next middleware/controller
  next();
});
