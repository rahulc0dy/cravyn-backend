/**
 * Middleware to handle asynchronous route handlers and catch errors.
 *
 * @param {Function} requestHandler - The async function to wrap.
 * @returns {Function} Express middleware that handles errors.
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
