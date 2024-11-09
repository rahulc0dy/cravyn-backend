import { Router } from "express";
import {
  addFood,
  deleteFood,
  getFood,
  searchFoodByName,
  updateFoodDiscount,
} from "../controllers/food.controller.js";
import { verifyRestaurantJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .get(getFood)
  .post(verifyRestaurantJwt, addFood)
  .delete(verifyRestaurantJwt, deleteFood);
router.route("/discount").patch(verifyRestaurantJwt, updateFoodDiscount);

router.route("/search").get(searchFoodByName);

export default router;
