import { Router } from "express";
import {
  addFood,
  deleteFood,
  getFood,
  updateFoodDiscount,
} from "../controllers/food.controller.js";

const router = Router();

router.route("/").get(getFood).post(addFood).delete(deleteFood);
router.route("/discount").patch(updateFoodDiscount);

export default router;
