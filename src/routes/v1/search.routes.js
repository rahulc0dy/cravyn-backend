import { Router } from "express";
import { searchFoodOrRestaurant } from "../../controllers/v1/search.controller.js";

const router = Router();

router.route("/").get(searchFoodOrRestaurant);

export default router;
