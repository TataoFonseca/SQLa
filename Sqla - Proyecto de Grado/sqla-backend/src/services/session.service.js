import { v4 as uuidv4 } from "uuid";
import { getPool } from "../db/mssql.js";

export async function createSession() {
    const pool = await getPool();

    const sessionId = uuidv4();
    const schemaName = `session_${sessionId.replace(/-/g, "")}`;

    await pool.request().query(`
        CREATE SCHEMA ${schemaName}
    `);

    await pool.request().query(`
        CREATE TABLE ${schemaName}.usuarios (
            id INT PRIMARY KEY IDENTITY(1,1),
            nombre NVARCHAR(100),
            edad INT
        );

        INSERT INTO ${schemaName}.usuarios (nombre, edad)
        VALUES ('Ana', 22), ('Luis', 30);
    `);

    await pool.request()
        .input("id", sessionId)
        .input("schema", schemaName)
        .query(`
            INSERT INTO sessions (id, schema_name)
            VALUES (@id, @schema)
        `);

    return { sessionId, schemaName };
}
export async function validateSession(sessionId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("id", sessionId)
        .query(`
            SELECT *
            FROM sessions
            WHERE id = @id
        `);

    if (result.recordset.length === 0) {
        return null;
    }

    return result.recordset[0];
}
export async function updateLastUsed(sessionId) {
    const pool = await getPool();

    await pool.request()
        .input("id", sessionId)
        .query(`
            UPDATE sessions
            SET last_used_at = GETDATE()
            WHERE id = @id
        `);
}