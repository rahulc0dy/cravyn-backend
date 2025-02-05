import { Router } from "express";
import {
  databaseCheck,
  healthCheck,
} from "../../controllers/v1/healthCheck.controller.js";

const router = Router();

router.route("/server").get(healthCheck);
router.route("/database").get(databaseCheck);

export default router;
