import rateLimit from "express-rate-limit";
// Default to 100 requests per minute to accommodate typical user interactions
// like browsing menu, managing cart, and checkout process
const windowMs = process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000; // default to 1 minute
const limit = process.env.RATE_LIMIT || 100; // default to 100 requests
export const limiter = rateLimit({
  windowMs: windowMs,
  limit: limit,
  standardHeaders: true, // add the `RateLimit-*` headers to the response
  legacyHeaders: false, // remove the `X-RateLimit-*` headers from the response
  message: {
    data: {},
    message: "Too many requests, please try again later.",
  },
});
