import { Router } from "express";
import {
  addRestaurant,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  verifyRestaurant,
  loginRestaurant,
  refreshAccessToken,
} from "../controllers/restaurant.controller.js";
import { verifyUserJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .get(getRestaurant)
  .post(addRestaurant)
  .patch(updateRestaurant)
  .delete(deleteRestaurant);

router.route("/login").post(loginRestaurant);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/verify").post(verifyRestaurant);

export default router;
