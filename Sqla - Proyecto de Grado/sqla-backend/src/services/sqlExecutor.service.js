import { getPool } from "../db/mssql.js"; // ajusta la ruta si es diferente

export async function executeSQL(sqlQuery) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(sqlQuery);

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
