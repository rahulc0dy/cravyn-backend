import { Router } from "express";
import {
  getRestaurantOwnerAccount,
  loginRestaurantOwner,
  registerRestaurantOwner,
  logoutRestaurantOwner,
  refreshAccessToken,
  deleteRestaurantOwnerAccount,
  updateRestaurantOwnerAccount,
  getDashboardData,
} from "../controllers/restaurantOwner.controller.js";
import { verifyUserJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginRestaurantOwner);
router.route("/logout").post(verifyUserJwt, logoutRestaurantOwner);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/dashboard").get(verifyUserJwt, getDashboardData);

router
  .route("/")
  .post(registerRestaurantOwner)
  .delete(verifyUserJwt, deleteRestaurantOwnerAccount)
  .patch(verifyUserJwt, updateRestaurantOwnerAccount)
  .get(verifyUserJwt, getRestaurantOwnerAccount);

export default router;
