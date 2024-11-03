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
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/")
  .get(getRestaurant)
  .post(upload.single("licenseCopy"), addRestaurant)
  .patch(updateRestaurant)
  .delete(deleteRestaurant);

router.route("/login").post(loginRestaurant);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verify").post(verifyRestaurant);

export default router;
