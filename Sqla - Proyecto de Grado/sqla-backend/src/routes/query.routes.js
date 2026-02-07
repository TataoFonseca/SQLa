import { Router } from "express";
import { executeQuery } from "../controllers/query.controller.js";

const router = Router();

router.post("/", executeQuery);

export default router;