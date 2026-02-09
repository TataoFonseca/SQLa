import { Router } from "express";
import { analyzeSQL, listQueries } from "../controllers/sql.controller.js";

const router = Router();

router.post("/analyze", analyzeSQL);
router.get("/history", listQueries);

export default router;
