import { Router } from "express";
import {
  addFood,
  deleteFood,
  getFood,
  searchFoodByName,
  updateFood,
  updateFoodAvailabilityStatus,
  updateFoodDiscount,
} from "../../controllers/v1/food.controller.js";
import { verifyRestaurantJwt } from "../../middlewares/v1/auth.middleware.js";
import { upload } from "../../middlewares/shared/multer.middleware.js";

const router = Router();

router
  .route("/")
  .get(verifyRestaurantJwt, getFood)
  .post(verifyRestaurantJwt, upload.single("foodImage"), addFood)
  .patch(verifyRestaurantJwt, upload.single("foodImage"), updateFood)
  .delete(verifyRestaurantJwt, deleteFood);

router.route("/discount").patch(verifyRestaurantJwt, updateFoodDiscount);
router
  .route("/availability")
  .patch(verifyRestaurantJwt, updateFoodAvailabilityStatus);

router.route("/search").get(searchFoodByName);

export default router;
