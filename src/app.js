import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthCheckRouter from "./routes/healthCheck.routes.js";
import customerRouter from "./routes/customer.routes.js";
import managementTeamRouter from "./routes/managementTeam.routes.js";
import restaurantOwnerRouter from "./routes/restaurantOwner.routes.js";

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
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/management-team", managementTeamRouter);
app.use("/api/v1/restaurant-owner", restaurantOwnerRouter);

export { app };
