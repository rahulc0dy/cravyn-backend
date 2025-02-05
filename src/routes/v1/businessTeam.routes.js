import { Router } from "express";
import {
  loginBusinessTeam,
  logoutBusinessTeam,
  registerBusinessTeam,
  refreshAccessToken,
  deleteBusinessTeamAccount,
  updateBusinessTeamAccount,
  getBusinessTeamAccount,
  getDashboardData,
  getRestaurantSales,
} from "../../controllers/v1/businessTeam.controller.js";
import { verifyUserJwt } from "../../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginBusinessTeam);
router.route("/logout").post(verifyUserJwt, logoutBusinessTeam);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .post(registerBusinessTeam)
  .delete(verifyUserJwt, deleteBusinessTeamAccount)
  .patch(verifyUserJwt, updateBusinessTeamAccount)
  .get(verifyUserJwt, getBusinessTeamAccount);

router.route("/dashboard").get(verifyUserJwt, getDashboardData);
router.route("/restaurant-sales").get(verifyUserJwt, getRestaurantSales);

export default router;
