import { Router } from "express";
import {
  login,
  logout,
  refreshAccessToken,
  register,
} from "../../controllers/v2/auth.controller.js";
import { verifyUserJwt } from "../../middlewares/v2/auth.middleware.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/logout").post(verifyUserJwt, logout);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
