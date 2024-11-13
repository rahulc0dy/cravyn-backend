import { Router } from "express";
import {
  loginBusinessTeam,
  logoutBusinessTeam,
  registerBusinessTeam,
  refreshAccessToken,
  deleteBusinessTeamAccount,
  updateBusinessTeamAccount,
  getBusinessTeamAccount,
} from "../controllers/businessTeam.controller.js";
import { verifyUserJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginBusinessTeam);
router.route("/register").post(registerBusinessTeam);
router.route("/logout").post(verifyUserJwt, logoutBusinessTeam);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .delete(verifyUserJwt, deleteBusinessTeamAccount)
  .patch(verifyUserJwt, updateBusinessTeamAccount)
  .get(verifyUserJwt, getBusinessTeamAccount);

export default router;
