import { parseSQL } from "../services/sqlParser.service.js";
import { validateQuery } from "../services/queryValidator.js";
import { executeSQL } from "../services/sqlExecutor.service.js";
import { getSession } from "../sessions/session.store.js";
import { saveQuery, getQueriesBySession } from "../services/project.service.js";

export async function analyzeSQL(req, res) {
    try {
        const { sql, sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ ok: false, error: "sessionId requerido" });
        }

        const session = getSession(sessionId);

        if (!session) {
            return res.status(404).json({ ok: false, error: "Sesión no encontrada" });
        }

        const parsed = parseSQL(sql);

        const validation = validateQuery(parsed);
        if (!validation.ok) {
            return res.status(400).json({ ok: false, error: validation.message });
        }

        /* updateSessionState(sessionId, parsed); */

        const executionResult = await executeSQL(sql);

        const id = await saveQuery({
            sessionId,
            sql,
            ast: parsed.ast,
            tables: parsed.tables,
            columns: parsed.columns,
            result: executionResult
        });

        res.json({
            ok: true,
            id,
            executionResult,
            ...parsed
        });

    } catch (err) {
        console.error("ERROR COMPLETO:", err);
        res.status(400).json({ ok: false, error: err?.message || "Error desconocido" });
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
