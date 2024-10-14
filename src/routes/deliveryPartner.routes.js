import { Router } from "express";
import {
  loginDeliveryPartner,
  logoutDeliveryPartner,
  registerDeliveryPartner,
  refreshAccessToken,
  deleteDeliveryPartnerAccount,
  updateDeliveryPartnerAccount,
  updateDeliveryPartnerImage,
  getDeliveryPartnerAccount,
} from "../controllers/deliveryPartner.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/login").post(loginDeliveryPartner);
router.route("/register").post(registerDeliveryPartner);
router.route("/logout").post(verifyJwt, logoutDeliveryPartner);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .delete(verifyJwt, deleteDeliveryPartnerAccount)
  .patch(verifyJwt, updateDeliveryPartnerAccount)
  .get(verifyJwt, getDeliveryPartnerAccount);
router
  .route("/profile-image")
  .patch(verifyJwt, upload.single("image"), updateDeliveryPartnerImage);

export default router;
