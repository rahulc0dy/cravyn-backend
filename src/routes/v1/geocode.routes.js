import { Router } from "express";
import {
  getAddress,
  getCoordinates,
} from "../../controllers/v1/geocode.controller.js";

const router = Router();

router.route("/address").get(getAddress);
router.route("/coordinates").get(getCoordinates);

export default router;
