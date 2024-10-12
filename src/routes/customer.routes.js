import { Router } from "express";
import {
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  refreshAccessToken,
  deleteCustomerAccount,
  updateCustomerAccount,
  updateCustomerImage,
  getCustomerAccount,
} from "../controllers/customer.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/login").post(loginCustomer);
router.route("/register").post(registerCustomer);
router.route("/logout").post(verifyJwt, logoutCustomer);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .delete(verifyJwt, deleteCustomerAccount)
  .patch(verifyJwt, updateCustomerAccount)
  .get(verifyJwt, getCustomerAccount);
router
  .route("/profile-image")
  .patch(verifyJwt, upload.single("image"), updateCustomerImage);

export default router;
