import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./utils/errorHandler.js";
import { STATUS } from "./constants.js";
import { configV1Routes } from "./routes/v1/routes.config.js";
import { configV2Routes } from "./routes/v2/routes.config.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

configV1Routes(app);
configV2Routes(app);

app.use((_req, res, _next) => {
  res.status(STATUS.CLIENT_ERROR.NOT_FOUND).json({
    data: {},
    message: "API endpoint not found.",
  });
});

app.use(errorHandler);

export { app };
