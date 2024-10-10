import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  deleteUserAccount,
  updateUserDetails,
} from "../controllers/customer.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginUser);
router.route("/register").post(registerUser);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/delete").delete(verifyJwt, deleteUserAccount);
router.route("/update").patch(verifyJwt, updateUserDetails);

export default router;
