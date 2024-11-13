import { Router } from "express";
import {
  loginManagementTeam,
  logoutManagementTeam,
  registerManagementTeam,
  refreshAccessToken,
  deleteManagementTeamAccount,
  updateManagementTeamAccount,
  getManagementTeamAccount,
} from "../controllers/managementTeam.controller.js";
import { verifyUserJwt } from "../middlewares/auth.middleware.js";

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

export default router;
