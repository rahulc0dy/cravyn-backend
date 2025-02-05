import express from "express";
import healthCheckRouter from "./healthCheck.routes.js";

const v2Routes = new express.Router();

v2Routes.use("/health-check", healthCheckRouter);

export default v2Routes;
