import { parseSQL } from "../services/sqlParser.service.js";
import { validateQuery } from "../services/queryValidator.js";
import { executeSQL } from "../services/sqlExecutor.service.js";
import { validateSession, updateLastUsed } from "../services/session.service.js";
import { saveQuery, getQueriesBySession, getQueriesForExport } from "../services/project.service.js";
// import { interpretSqlError } from "../services/errorInterpreter.service.js";

export async function analyzeSQL(req, res) {
    try {
        const { sessionId, sql } = req.body;

        if (!sessionId) {
            return res.status(400).json({ ok: false, error: "sessionId requerido" });
        }

        if (!sql) {
            return res.status(400).json({ ok: false, error: "SQL requerido" });
        }

        //  Validar sesión en DB
        const session = await validateSession(sessionId);

        if (!session) {
            return res.status(404).json({ ok: false, error: "Sesión no encontrada" });
        }

        //  Actualizar última actividad
        await updateLastUsed(sessionId);

        // Parsear con el schema de la sesión
        const parsed = parseSQL(sql, session.schema_name);

        const validation = validateQuery(parsed);
        if (!validation.ok) {
            return res.status(400).json({ ok: false, error: validation.message });
        }

        //  Ejecutar en el schema correcto
        const executionResult = await executeSQL(sql, session.schema_name);

        // Intentar guardar la consulta, pero no fallar si no se puede
        let id = null;
        try {
            id = await saveQuery({
                sessionId,
                sql, // Solo enviamos el SQL original
                ast: parsed.ast,
                tables: parsed.tables,
                columns: parsed.columns
            });
        } catch (saveError) {
            console.warn("No se pudo guardar el historial:", saveError.message);
        }

        return res.json({
            ok: true,
            id,
            executionResult,
            originalSQL: parsed.originalSQL,
            transformedSQL: parsed.transformedSQL,
            needsSchemaInjection: parsed.needsSchema,
            warning: id ? null : "Consulta ejecutada pero no guardada en historial"
        });

    } catch (err) {
        console.error("ERROR COMPLETO:", err);
        return res.status(500).json({
            ok: false,
            error: err.message
            // error: interpretSqlError(err.message)
        });
    }
}

export async function listQueries(req, res) {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({ ok: false, error: "sessionId requerido" });
        }

        const data = await getQueriesBySession(sessionId);

        res.json({ ok: true, data });

    } catch (err) {
        console.error("ERROR en listQueries:", err);
        res.status(500).json({ ok: false, error: err.message, data: [] });
    }
}

export async function exportSQL(req, res) {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({ ok: false, error: "sessionId requerido" });
        }

        const queries = await getQueriesForExport(sessionId);

        // Si no hay consultas, retornar archivo vacío
        if (!queries || queries.length === 0) {
            return res.status(200).send("");
        }

        // Construir el archivo .sql uniendo las sentencias.
        // Aquí se usa el sql original o el transformado según preferencia. Usamos sql original que es lo que el usuario construyó.
        // El frontend bloquea "SELECT", pero si es solo estructura (CREATE/INSERT), usamos sql_text que es lo que ve el usuario. Usaremos sql_text porque es más claro para el usuario.
        const sqlLines = queries.map(q => {
            let stmt = q.sql.trim();
            if (!stmt.endsWith(';')) stmt += ';';
            return stmt;
        });

        const fileContent = sqlLines.join('\n\n');

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename=session_${sessionId}.sql`);

        return res.send(fileContent);

    } catch (err) {
        console.error("ERROR en exportSQL:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
}