import { Router } from "express";
import {
  addRestaurant,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  verifyRestaurant,
} from "../controllers/restaurant.controller.js";

const router = Router();

router
  .route("/")
  .get(getRestaurant)
  .post(addRestaurant)
  .patch(updateRestaurant)
  .delete(deleteRestaurant);

// router.route("/recommended").get(getNearestRestaurants);

router.route("/verify").post(verifyRestaurant);

export default router;
