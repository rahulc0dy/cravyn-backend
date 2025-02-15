import express from "express";
import healthCheckRouter from "./healthCheck.routes.js";
import authRouter from "./auth.routes.js";

const v2Routes = new express.Router();

v2Routes.use("/health-check", healthCheckRouter);
v2Routes.use("/", authRouter);

export default v2Routes;
