import { Router } from "express";
import {
  addRestaurant,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  loginRestaurant,
  refreshAccessToken,
  getRestaurantCatalog,
  logoutRestaurant,
  getRestaurantsList,
  searchRestaurantByName,
  getRestaurantPendingOrders,
  getRecommendedRestaurants,
  getRestaurantFoods,
  getRestaurantPackedOrders,
  getRestaurantCancelledOrders,
  getRestaurantDeliveredOrders,
} from "../controllers/restaurant.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  verifyRestaurantJwt,
  verifyUserJwt,
} from "../middlewares/auth.middleware.js";
import {
  getRestaurantQueryByRestaurantId,
  raiseRestaurantQuery,
} from "../controllers/supportSystem.controller.js";
import { getFood } from "../controllers/food.controller.js";

const router = Router();

router.route("/list").get(getRestaurantsList);
router.route("/menu").get(getRestaurantCatalog);
router.route("/search").get(searchRestaurantByName);

router
  .route("/")
  .get(verifyRestaurantJwt, getRestaurant)
  .post(upload.single("licenseCopy"), addRestaurant)
  .patch(verifyRestaurantJwt, updateRestaurant)
  .delete(verifyUserJwt, deleteRestaurant);

router
  .route("/query")
  .post(verifyRestaurantJwt, raiseRestaurantQuery)
  .get(verifyRestaurantJwt, getRestaurantQueryByRestaurantId);

router.route("/login").post(loginRestaurant);
router.route("/logout").post(verifyRestaurantJwt, logoutRestaurant);
router.route("/refresh-token").get(refreshAccessToken);

router.route("/catalog").get(verifyRestaurantJwt, getRestaurantCatalog);

router
  .route("/orders/pending")
  .get(verifyRestaurantJwt, getRestaurantPendingOrders);
router
  .route("/orders/packed")
  .get(verifyRestaurantJwt, getRestaurantPackedOrders);
router
  .route("/orders/cancelled")
  .get(verifyRestaurantJwt, getRestaurantCancelledOrders);
router
  .route("/orders/delivered")
  .get(verifyRestaurantJwt, getRestaurantDeliveredOrders);

router.route("/recommended").get(getRecommendedRestaurants);
router.route("/food").get(getRestaurantFoods);

export default router;
