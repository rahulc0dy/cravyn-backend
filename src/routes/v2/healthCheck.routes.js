import { Router } from "express";
import { healthCheck } from "../../controllers/v2/healthCheck.controller.js";

const router = Router();

router.route("/server").get(healthCheck);

export default router;
