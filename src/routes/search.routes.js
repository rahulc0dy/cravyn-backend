import { Router } from "express";
import { searchFoodOrRestaurant } from "../controllers/search.controller.js";

const router = Router();

router.route("/").get(searchFoodOrRestaurant);

export default router;
