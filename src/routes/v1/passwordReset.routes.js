import { Router } from "express";
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../../controllers/v1/passwordReset.controller.js";

const router = Router();

router.route("/").post(forgotPassword);
router.route("/verify-otp").post(verifyOtp);
router.route("/reset-password").patch(resetPassword);

export default router;
