import { Router } from "express";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/passwordReset.controller.js";

const router = Router();

router.route("/").post(forgotPassword).patch(resetPassword);

export default router;
