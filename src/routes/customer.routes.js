import { Router } from "express";
import {
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  refreshAccessToken,
  deleteCustomerAccount,
  updateCustomerDetails,
} from "../controllers/customer.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginCustomer);
router.route("/register").post(registerCustomer);
router.route("/logout").post(verifyJwt, logoutCustomer);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/delete").delete(verifyJwt, deleteCustomerAccount);
router.route("/update").patch(verifyJwt, updateCustomerDetails);

export default router;
