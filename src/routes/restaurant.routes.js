import { Router } from "express";
import {
  addRestaurant,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  verifyRestaurant,
  loginRestaurant,
  refreshAccessToken,
  getRestaurantCatalog,
  logoutRestaurant,
  getRestaurantsList,
  searchRestaurantByName,
  getRestaurantPendingOrders,
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
router.route("/verify").post(verifyUserJwt, verifyRestaurant);

router.route("/catalog").get(verifyRestaurantJwt, getRestaurantCatalog);
router
  .route("/orders/pending")
  .get(verifyRestaurantJwt, getRestaurantPendingOrders);

export default router;
