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
  getRestaurantFoodSalesData,
} from "../../controllers/v1/restaurantOwner.controller.js";
import { verifyUserJwt } from "../../middlewares/v1/auth.middleware.js";

const router = Router();

router.route("/login").post(loginRestaurantOwner);
router.route("/logout").post(verifyUserJwt, logoutRestaurantOwner);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/dashboard").get(verifyUserJwt, getDashboardData);
router.route("/food-sales").get(verifyUserJwt, getRestaurantFoodSalesData);

router
  .route("/")
  .post(registerRestaurantOwner)
  .delete(verifyUserJwt, deleteRestaurantOwnerAccount)
  .patch(verifyUserJwt, updateRestaurantOwnerAccount)
  .get(verifyUserJwt, getRestaurantOwnerAccount);

export default router;
