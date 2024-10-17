import { Router } from "express";
import { addRestaurant } from "../controllers/restaurant.controller.js";

const router = Router();

router.route("/add").post(addRestaurant);

export default router;
