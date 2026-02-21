import { getPool } from "../db/mssql.js";
import { securityCheck } from "./sqlSecurity.service.js";

export async function executeSQL(sqlQuery, schemaName) {

    const secure = securityCheck(sqlQuery);
    if (!secure.ok) {
        throw new Error(secure.message);
    }

    const schemaRegex = /([a-zA-Z0-9_]+)\./g;
    const matches = [...sqlQuery.matchAll(schemaRegex)];

    for (const match of matches) {
        const usedSchema = match[1];

        if (usedSchema.toLowerCase() !== schemaName.toLowerCase()) {
            throw new Error("No puedes acceder a otros esquemas.");
        }
    }

    try {
        const pool = await getPool();

        // 🔹 Ejecutar siempre dentro del contexto correcto
        const finalQuery = `
            SET NOCOUNT ON;
            ${sqlQuery}
        `;

        const result = await pool.request().query(finalQuery);

        return {
            rows: result.recordset || [],
            rowsAffected: result.rowsAffected || [],
            message: "Consulta ejecutada correctamente"
        };

    } catch (error) {
        console.error("❌ Error ejecutando en SQL Server:", error.message);
        throw new Error(error.message);
    }
}