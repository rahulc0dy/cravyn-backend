/**
 * Cookie options for setting HTTP cookies.
 * @constant {Object} cookieOptions
 * @property {boolean} cookieOptions.httpOnly - Ensures the cookie is accessible only by the web server.
 * @property {boolean} cookieOptions.secure - Ensures the cookie is sent over HTTPS in production.
 * @property {string} cookieOptions.sameSite - Controls whether cookies are sent with cross-site requests.
 *    - "None" in production for cross-site usage.
 *    - "Lax" in development for security.
 */
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
};
