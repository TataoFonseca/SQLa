import { parseSQL } from "../services/sqlParser.service.js";
import { validateQuery } from "../services/queryValidator.js";
import { executeSQL } from "../services/sqlExecutor.service.js";
import { validateSession, updateLastUsed } from "../services/session.service.js";
import { saveQuery, getQueriesBySession } from "../services/project.service.js";

export async function analyzeSQL(req, res) {
    try {
        const { sessionId, sql } = req.body;

        if (!sessionId) {
            return res.status(400).json({ ok: false, error: "sessionId requerido" });
        }

        if (!sql) {
            return res.status(400).json({ ok: false, error: "SQL requerido" });
        }

        // 🔹 Validar sesión en DB
        const session = await validateSession(sessionId);

        if (!session) {
            return res.status(404).json({ ok: false, error: "Sesión no encontrada" });
        }

        // 🔹 Actualizar última actividad
        await updateLastUsed(sessionId);

        // 🔹 Parsear
        const parsed = parseSQL(sql);

        const validation = validateQuery(parsed);
        if (!validation.ok) {
            return res.status(400).json({ ok: false, error: validation.message });
        }

        // 🔹 Ejecutar en el schema correcto
        const executionResult = await executeSQL(sql, session.schema_name);

        const id = await saveQuery({
            sessionId,
            sql,
            ast: parsed.ast,
            tables: parsed.tables,
            columns: parsed.columns,
            result: executionResult
        });

        return res.json({
            ok: true,
            id,
            executionResult,
            ...parsed
        });

    } catch (err) {
        console.error("ERROR COMPLETO:", err);
        return res.status(500).json({
            ok: false,
            error: err.message
        });
    }
}

export async function listQueries(req, res) {
    try {
        const { sessionId } = req.params;

        const data = await getQueriesBySession(sessionId);

        res.json({ ok: true, data });

    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
}