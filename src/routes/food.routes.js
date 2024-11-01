import { Router } from "express";
import {
  addFood,
  deleteFood,
  getFood,
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

export default router;
