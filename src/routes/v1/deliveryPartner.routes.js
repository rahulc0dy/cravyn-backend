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
} from "../../controllers/v1/deliveryPartner.controller.js";
import { verifyUserJwt } from "../../middlewares/v1/auth.middleware.js";
import { upload } from "../../middlewares/shared/multer.middleware.js";

const router = Router();

router.route("/login").post(loginDeliveryPartner);
router.route("/logout").post(verifyUserJwt, logoutDeliveryPartner);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .post(registerDeliveryPartner)
  .delete(verifyUserJwt, deleteDeliveryPartnerAccount)
  .patch(verifyUserJwt, updateDeliveryPartnerAccount)
  .get(verifyUserJwt, getDeliveryPartnerAccount);
router
  .route("/profile-image")
  .patch(verifyUserJwt, upload.single("image"), updateDeliveryPartnerImage);

export default router;
