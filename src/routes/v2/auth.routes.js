import { Router } from "express";
import {
  login,
  logout,
  register,
} from "../../controllers/v2/auth.controller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/logout").post(logout);

export default router;
