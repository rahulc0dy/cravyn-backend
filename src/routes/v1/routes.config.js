import express from "express";
import healthCheckRouter from "./healthCheck.routes.js";
import geocodeRouter from "./geocode.routes.js";
import customerRouter from "./customer.routes.js";
import deliveryPartnerRouter from "./deliveryPartner.routes.js";
import managementTeamRouter from "./managementTeam.routes.js";
import businessTeamRouter from "./businessTeam.routes.js";
import restaurantOwnerRouter from "./restaurantOwner.routes.js";
import foodRouter from "./food.routes.js";
import restaurantRouter from "./restaurant.routes.js";
import searchRouter from "./search.routes.js";
import passwordResetRouter from "./passwordReset.routes.js";

const v1Routes = express.Router();

v1Routes.use("/health-check", healthCheckRouter);
v1Routes.use("/geocode", geocodeRouter);
v1Routes.use("/customer", customerRouter);
v1Routes.use("/delivery-partner", deliveryPartnerRouter);
v1Routes.use("/management-team", managementTeamRouter);
v1Routes.use("/business-team", businessTeamRouter);
v1Routes.use("/restaurant-owner", restaurantOwnerRouter);
v1Routes.use("/foods", foodRouter);
v1Routes.use("/restaurants", restaurantRouter);
v1Routes.use("/search", searchRouter);
v1Routes.use("/forgot-password", passwordResetRouter);

export default v1Routes;
