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
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginBusinessTeam);
router.route("/register").post(registerBusinessTeam);
router.route("/logout").post(verifyJwt, logoutBusinessTeam);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .delete(verifyJwt, deleteBusinessTeamAccount)
  .patch(verifyJwt, updateBusinessTeamAccount)
  .get(verifyJwt, getBusinessTeamAccount);

export default router;
