import { Router } from "express";
import { serverHealthCheck } from "../../controllers/v2/healthCheck.controller.js";

const router = Router();

router.route("/server").get(serverHealthCheck);

export default router;
