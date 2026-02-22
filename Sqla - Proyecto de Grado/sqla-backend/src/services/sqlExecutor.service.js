import { getPool } from "../db/mssql.js";
import { securityCheck } from "./sqlSecurity.service.js";
import { parseSQL } from "./sqlParser.service.js";

export async function executeSQL(sqlQuery, schemaName) {

    const secure = securityCheck(sqlQuery);
    if (!secure.ok) {
        throw new Error(secure.message);
    }

    // Parsear y transformar el SQL con el schema
    const parsed = parseSQL(sqlQuery, schemaName);

    // Usar el SQL transformado para ejecutar
    const sqlToExecute = parsed.transformedSQL || sqlQuery;

    // Validación MEJORADA: Solo buscar schemas válidos (letras, guiones bajos)
    // Excluir números decimales y otros patrones que no sean schemas reales
    const schemaRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\.[a-zA-Z_][a-zA-Z0-9_]*/g;
    const matches = [...sqlToExecute.matchAll(schemaRegex)];

    const uniqueSchemas = new Set();
    for (const match of matches) {
        const usedSchema = match[1];

        // Ignorar si parece un número decimal (como 999.99)
        if (/^\d+$/.test(usedSchema)) {
            continue; // Es un número, no un schema
        }

        uniqueSchemas.add(usedSchema);
    }

    // Validar cada schema encontrado
    for (const usedSchema of uniqueSchemas) {
        // Permitir solo el schema actual y schemas del sistema
        if (usedSchema.toLowerCase() !== schemaName.toLowerCase() &&
            !['dbo', 'sys', 'information_schema'].includes(usedSchema.toLowerCase())) {
            throw new Error(`No puedes acceder al schema "${usedSchema}". Solo puedes acceder a tu propio schema.`);
        }
    }

    try {
        const pool = await getPool();

        // Ejecutar la consulta transformada
        const finalQuery = `
            SET NOCOUNT ON;
            ${sqlToExecute}
        `;

        console.log('🔍 SQL Original:', sqlQuery);
        console.log('🔍 SQL Transformado:', sqlToExecute);

        const result = await pool.request().query(finalQuery);

        return {
            rows: result.recordset || [],
            rowsAffected: result.rowsAffected || [],
            originalSQL: sqlQuery,
            transformedSQL: sqlToExecute,
            message: "Consulta ejecutada correctamente"
        };

    } catch (error) {
        console.error("❌ Error ejecutando en SQL Server:", error.message);

        if (error.message.includes("There is already an object named")) {
            throw new Error(`La tabla ya existe en tu schema. Las tablas son aisladas por sesión.`);
        }

        throw new Error(error.message);
    }
}