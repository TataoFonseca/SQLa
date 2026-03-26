import { Router } from "express";
import {
    analyzeSQL, listQueries, exportSQL,
    sendGlobalDiagram // NUEVO: Para obtener el diagrama ERD global
} from "../controllers/sql.controller.js";
import { createSession, validateSession } from "../services/session.service.js";

const router = Router();

//  Crear sesión
router.post("/session", async (req, res) => {
    try {
        const data = await createSession();
        res.json({ ok: true, ...data });
    } catch (err) {
        console.error("Error creating session:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

//  Obtener sesión desde DB
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

// Analizar y ejecutar SQL
router.post("/analyze", analyzeSQL);

//  Obtener historial de consultas
router.get("/history/:sessionId", listQueries);

// Exportar SQL de la sesión
router.get("/export-sql/:sessionId", exportSQL);

// ── Diagrama ERD global (usando el script SQL de la BD precargada)
// GET /api/sql/global-diagram
// Retorna: { ok: true, diagram: "erDiagram\n  Album { ... }\n ..." }
router.get("/global-diagram", sendGlobalDiagram);


export default router;