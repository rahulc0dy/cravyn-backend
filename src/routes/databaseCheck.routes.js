import express from "express";
import { databaseCheck } from "../controllers/databaseCheck.controller.js";

const router = express.Router();

// database checking route
router.route("/").get(databaseCheck);

export default router;
