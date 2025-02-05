/**
 * Cookie options for setting HTTP cookies.
 * @constant {Object} cookieOptions
 * @property {boolean} cookieOptions.httpOnly - Ensures the cookie is accessible only by the web server.
 * @property {boolean} cookieOptions.secure - Ensures the cookie is sent over HTTPS in production.
 * @property {string} cookieOptions.sameSite - Controls whether cookies are sent with cross-site requests.
 *    - "None" in production for cross-site usage.
 *    - "Lax" in development for security.
 */

const NODE_ENV = process.env.NODE_ENV;

if (!NODE_ENV) {
  throw new Error(
    "NODE_ENV is not defined. Please set NODE_ENV to 'development', 'production', or 'staging'."
  );
}

const isProd = NODE_ENV === "production" || NODE_ENV === "staging";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "None" : "Lax",
};

if (cookieOptions.sameSite === "None" && !cookieOptions.secure) {
  throw new Error("Cookies with sameSite='None' must also have secure=true.");
}

export { cookieOptions };
