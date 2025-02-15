import { Router } from "express";
import {
  loginManagementTeam,
  logoutManagementTeam,
  registerManagementTeam,
  refreshAccessToken,
  deleteManagementTeamAccount,
  updateManagementTeamAccount,
  getManagementTeamAccount,
} from "../../controllers/v1/managementTeam.controller.js";
import { verifyUserJwt } from "../../middlewares/v1/auth.middleware.js";
import {
  answerCustomerQuery,
  answerRestaurantQuery,
  getCustomerQueries,
  getDashboardData,
  getRestaurantQueries,
} from "../../controllers/v1/supportSystem.controller.js";
import {
  getRestaurantsList,
  verifyRestaurant,
} from "../../controllers/v1/restaurant.controller.js";

const router = Router();

router.route("/login").post(loginManagementTeam);
router.route("/register").post(registerManagementTeam);
router.route("/logout").post(verifyUserJwt, logoutManagementTeam);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .delete(verifyUserJwt, deleteManagementTeamAccount)
  .patch(verifyUserJwt, updateManagementTeamAccount)
  .get(verifyUserJwt, getManagementTeamAccount);

router.route("/dashboard").get(verifyUserJwt, getDashboardData);

router.route("/partner-requests").get(getRestaurantsList);

router
  .route("/query/customer")
  .get(verifyUserJwt, getCustomerQueries)
  .post(verifyUserJwt, answerCustomerQuery);
router
  .route("/query/restaurant")
  .get(verifyUserJwt, getRestaurantQueries)
  .post(verifyUserJwt, answerRestaurantQuery);
router.route("/verify-partner").post(verifyUserJwt, verifyRestaurant);

export default router;
