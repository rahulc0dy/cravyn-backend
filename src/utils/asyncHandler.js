/**
 * Middleware to handle asynchronous route handlers.
 *
 * This function wraps an asynchronous request handler to ensure that any
 * errors are caught and passed to the next middleware in the chain.
 *
 * @function asyncHandler
 * @param {Function} requestHandler - The asynchronous request handler function
 * that takes the standard Express parameters (req, res, next).
 * @returns {Function} A new function that takes the same parameters and handles
 * the asynchronous request handler, catching any errors and passing them to
 * the next middleware.
 *
 * @example
 * const exampleHandler = asyncHandler(async (req, res) => {
 *   const data = await fetchData();
 *   res.json(data);
 * });
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
