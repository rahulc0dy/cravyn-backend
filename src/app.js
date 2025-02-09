import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./utils/errorHandler.js";
import v1Routes from "./routes/v1/routes.config.js";
import v2Routes from "./routes/v2/routes.config.js";
import { STATUS } from "./constants/statusCodes.js";
import { morganMiddleware } from "./middlewares/morgan.middleware.js";
import "./utils/instrument.js";

import * as Sentry from "@sentry/node";

const app = express();
Sentry.setupExpressErrorHandler(app);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(morganMiddleware);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);

app.use((_req, res, _next) => {
  res.status(STATUS.CLIENT_ERROR.NOT_FOUND).json({
    data: {},
    message: "API endpoint not found.",
  });
});

app.use(errorHandler);

export { app };
