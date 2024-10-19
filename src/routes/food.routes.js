import { Router } from "express";
import {
  addFood,
  getFood,
  updateFoodDiscount,
} from "../controllers/food.controller.js";

const router = Router();

router.route("/").get(getFood).post(addFood);
router.route("/discount").patch(updateFoodDiscount);

export default router;
