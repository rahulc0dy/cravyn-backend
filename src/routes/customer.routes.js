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
import { verifyUserJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getCustomerQueryByCustomerId,
  raiseCustomerQuery,
} from "../controllers/supportSystem.controller.js";

const router = Router();

router.route("/login").post(loginCustomer);
router.route("/register").post(registerCustomer);
router.route("/logout").post(verifyUserJwt, logoutCustomer);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/query")
  .post(verifyUserJwt, raiseCustomerQuery)
  .get(verifyUserJwt, getCustomerQueryByCustomerId);

router
  .route("/")
  .delete(verifyUserJwt, deleteCustomerAccount)
  .patch(verifyUserJwt, updateCustomerAccount)
  .get(verifyUserJwt, getCustomerAccount);
router
  .route("/profile-image")
  .patch(verifyUserJwt, upload.single("image"), updateCustomerImage);

export default router;
