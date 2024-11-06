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
} from "../controllers/restaurant.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  verifyRestaurantJwt,
  verifyUserJwt,
} from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .get(verifyRestaurantJwt, getRestaurant)
  .post(upload.single("licenseCopy"), addRestaurant)
  .patch(verifyRestaurantJwt, updateRestaurant)
  .delete(deleteRestaurant);

router.route("/login").post(loginRestaurant);
router.route("/refresh-token").get(refreshAccessToken);
router.route("/verify").post(verifyUserJwt, verifyRestaurant);

router.route("/catalog").get(verifyRestaurantJwt, getRestaurantCatalog);

export default router;
