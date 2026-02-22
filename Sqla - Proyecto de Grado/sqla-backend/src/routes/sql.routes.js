import { Router } from "express";
import { analyzeSQL, listQueries } from "../controllers/sql.controller.js";
import { createSession, validateSession } from "../services/session.service.js";

const router = Router();

// 🔹 Crear sesión
router.post("/session", async (req, res) => {
    try {
        const data = await createSession();
        res.json({ ok: true, ...data });
    } catch (err) {
        console.error("Error creating session:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 🔹 Obtener sesión desde DB
router.get("/session/:id", async (req, res) => {
    try {
        const session = await validateSession(req.params.id);

        if (!session) {
            return res.status(404).json({ ok: false, message: "Session not found" });
        }

        res.json({ ok: true, ...session });
    } catch (err) {
        console.error("Error getting session:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 🔹 Analizar y ejecutar SQL
router.post("/analyze", analyzeSQL);

// 🔹 Obtener historial de consultas
router.get("/history/:sessionId", listQueries);

export default router;