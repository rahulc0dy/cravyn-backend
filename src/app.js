import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthCheckRouter from "./routes/v1/healthCheck.routes.js";
import customerRouter from "./routes/v1/customer.routes.js";
import managementTeamRouter from "./routes/v1/managementTeam.routes.js";
import businessTeamRouter from "./routes/v1/businessTeam.routes.js";
import restaurantOwnerRouter from "./routes/v1/restaurantOwner.routes.js";
import restaurantRouter from "./routes/v1/restaurant.routes.js";
import deliveryPartnerRouter from "./routes/v1/deliveryPartner.routes.js";
import foodRouter from "./routes/v1/food.routes.js";
import passwordResetRouter from "./routes/v1/passwordReset.routes.js";
import geocodeRouter from "./routes/v1/geocode.routes.js";
import searchRouter from "./routes/v1/search.routes.js";
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
    success: false,
    message: "API endpoint not found",
  });
});

app.use(errorHandler);

export { app };
