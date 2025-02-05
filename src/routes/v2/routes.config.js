import express from "express";
import healthCheckRouter from "./healthCheck.routes.js";

export const configV2Routes = (app) => {
  const v2Routes = new express();

  v2Routes.use("/health-check", healthCheckRouter);

  app.use("/api/v2", v2Routes);
};
