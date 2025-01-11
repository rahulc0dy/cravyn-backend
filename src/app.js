import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthCheckRouter from "./routes/healthCheck.routes.js";
import customerRouter from "./routes/customer.routes.js";
import managementTeamRouter from "./routes/managementTeam.routes.js";
import businessTeamRouter from "./routes/businessTeam.routes.js";
import restaurantOwnerRouter from "./routes/restaurantOwner.routes.js";
import restaurantRouter from "./routes/restaurant.routes.js";
import deliveryPartnerRouter from "./routes/deliveryPartner.routes.js";
import foodRouter from "./routes/food.routes.js";
import passwordResetRouter from "./routes/passwordReset.routes.js";
import geocodeRouter from "./routes/geocode.routes.js";
import searchRouter from "./routes/search.routes.js";
import { errorHandler } from "./utils/errorHandler.js";

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

app.use("/api/v1/health-check", healthCheckRouter);
app.use("/api/v1/geocode", geocodeRouter);

app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/delivery-partner", deliveryPartnerRouter);
app.use("/api/v1/management-team", managementTeamRouter);
app.use("/api/v1/business-team", businessTeamRouter);
app.use("/api/v1/restaurant-owner", restaurantOwnerRouter);
app.use("/api/v1/foods", foodRouter);
app.use("/api/v1/restaurants", restaurantRouter);

app.use("/api/v1/search", searchRouter);

app.use("/api/v1/forgot-password", passwordResetRouter);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

app.use(errorHandler);

export { app };
