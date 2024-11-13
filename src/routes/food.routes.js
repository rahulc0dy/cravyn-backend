import { Router } from "express";
import {
  addFood,
  deleteFood,
  getFood,
  searchFoodByName,
  updateFood,
  updateFoodDiscount,
} from "../controllers/food.controller.js";
import { verifyRestaurantJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/")
  .get(verifyRestaurantJwt, getFood)
  .post(verifyRestaurantJwt, upload.single("foodImage"), addFood)
  .patch(verifyRestaurantJwt, upload.single("foodImage"), updateFood)
  .delete(verifyRestaurantJwt, deleteFood);

router.route("/discount").patch(verifyRestaurantJwt, updateFoodDiscount);

router.route("/search").get(searchFoodByName);

export default router;
