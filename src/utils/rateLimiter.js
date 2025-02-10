import rateLimit from "express-rate-limit";
const windowMs = process.env.RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000; // default to 5 minutes
const limit = process.env.RATE_LIMIT || 10; // default to 10 requests

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
