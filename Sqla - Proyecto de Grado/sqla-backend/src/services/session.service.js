import crypto from "crypto";
import { getPool } from "../db/mssql.js";
import { createSessionWithId, saveSchema } from "../sessions/session.store.js"; // 👈 CAMBIA LA IMPORTACIÓN

export async function createSession() {
    const sessionId = crypto.randomUUID();
    const schemaName = "session_" + sessionId.replace(/-/g, "");

    const pool = await getPool();

    await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${schemaName}')
        BEGIN
            EXEC('CREATE SCHEMA ${schemaName}')
        END

        CREATE TABLE ${schemaName}.usuarios (
            id INT PRIMARY KEY IDENTITY(1,1),
            nombre VARCHAR(100),
            edad INT
        );

        INSERT INTO ${schemaName}.usuarios (nombre, edad)
        VALUES ('Ana',22), ('Luis',30);
    `);

    // 👇 CREAR LA SESIÓN EN MEMORIA CON EL MISMO ID
    createSessionWithId(sessionId);


    saveSchema(sessionId, {
        tables: {
            usuarios: { name: "usuarios", schema: schemaName }
        },
        relations: []
    });

    return { sessionId, schemaName };
}