import { parseSQL } from "../services/sqlParser.service.js";
import { saveQuery } from "../services/project.service.js";
import { getQueries } from "../services/project.service.js";

export async function analyzeSQL(req, res) {
    try {
        const { sql } = req.body;

        const parsed = parseSQL(sql);
        const id = await saveQuery({
            sql,
            ast: parsed.ast,
            tables: parsed.tables,
            columns: parsed.columns
        });

        res.json({
            ok: true,
            id,
            ...parsed
        });
    } catch (err) {
        console.error("❌ ERROR REAL:", err);
        res.status(400).json({
            ok: false,
            error: err.message,
            stack: err.stack
        });
    }
}

export async function listQueries(req, res) {
    try {
        const data = await getQueries();
        res.json({ ok: true, data });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
}