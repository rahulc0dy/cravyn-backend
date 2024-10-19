import { Router } from "express";
import {
  addFoodItem,
  deleteFoodItem,
  getFoodItem,
  updateFoodItem,
} from "../controllers/foodItem.controller.js";

const router = Router();

router
  .route("/")
  .get(getFoodItem)
  .post(addFoodItem)
  .patch(updateFoodItem)
  .delete(deleteFoodItem);

export default router;
