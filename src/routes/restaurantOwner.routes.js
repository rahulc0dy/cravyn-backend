import { Router } from "express";
import {
  getRestaurantOwnerAccount,
  loginRestaurantOwner,
  registerRestaurantOwner,
  logoutRestaurantOwner,
  refreshAccessToken,
  deleteRestaurantOwnerAccount,
  updateRestaurantOwnerAccount,
} from "../controllers/restaurantOwner.controller.js";
import { verifyUserJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginRestaurantOwner);
router.route("/register").post(registerRestaurantOwner);
router.route("/logout").post(verifyUserJwt, logoutRestaurantOwner);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .delete(verifyUserJwt, deleteRestaurantOwnerAccount)
  .patch(verifyUserJwt, updateRestaurantOwnerAccount)
  .get(verifyUserJwt, getRestaurantOwnerAccount);

export default router;
