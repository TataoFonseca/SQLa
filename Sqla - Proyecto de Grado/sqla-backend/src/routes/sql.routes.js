import { Router } from "express";
import { analyzeSQL, listQueries } from "../controllers/sql.controller.js";
import { createSession } from "../services/session.service.js";
import { getSession } from "../sessions/session.store.js";

const router = Router();

// 🔹 Crear sesión
router.post("/session", async (req, res) => {
    const data = await createSession();
    res.json(data);
});

// 🔹 Obtener sesión
router.get("/session/:id", (req, res) => {
    const { id } = req.params;
    const session = getSession(id);

    if (!session) {
        return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
});

// Tus rutas actuales
router.post("/analyze", analyzeSQL);
router.get("/history/:sessionId", listQueries);

export default router;
