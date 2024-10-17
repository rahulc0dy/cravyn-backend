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
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginRestaurantOwner);
router.route("/register").post(registerRestaurantOwner);
router.route("/logout").post(verifyJwt, logoutRestaurantOwner);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/")
  .delete(verifyJwt, deleteRestaurantOwnerAccount)
  .patch(verifyJwt, updateRestaurantOwnerAccount)
  .get(verifyJwt, getRestaurantOwnerAccount);

export default router;
