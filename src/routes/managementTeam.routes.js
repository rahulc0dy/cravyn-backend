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
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginManagementTeam);
router.route("/register").post(registerManagementTeam);
router.route("/logout").post(verifyJwt, logoutManagementTeam);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .delete(verifyJwt, deleteManagementTeamAccount)
  .patch(verifyJwt, updateManagementTeamAccount)
  .get(verifyJwt, getManagementTeamAccount);

export default router;
