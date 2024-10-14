import { Router } from "express";
import {
  loginBusinessTeam,
  logoutBusinessTeam,
  refreshAccessToken,
  deleteBusinessTeamAccount,
  getBusinessTeamAccount,
} from "../controllers/businessTeam.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginBusinessTeam);
router.route("/logout").post(verifyJwt, logoutBusinessTeam);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .delete(verifyJwt, deleteBusinessTeamAccount)
  .get(verifyJwt, getBusinessTeamAccount);

export default router;
