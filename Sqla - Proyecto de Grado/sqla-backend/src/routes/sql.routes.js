import { Router } from "express";
import { analyzeSQL, listQueries } from "../controllers/sql.controller.js";
import { createSession, validateSession } from "../services/session.service.js";

const router = Router();

// 🔹 Crear sesión
router.post("/session", async (req, res) => {
    const data = await createSession();
    res.json(data);
});

// 🔹 Obtener sesión desde DB
router.get("/session/:id", async (req, res) => {
    const session = await validateSession(req.params.id);

    if (!session) {
        return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
});

router.post("/analyze", analyzeSQL);
router.get("/history/:sessionId", listQueries);

export default router;