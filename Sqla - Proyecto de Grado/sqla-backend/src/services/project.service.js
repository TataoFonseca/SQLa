import { getPool } from "../db/mssql.js";
import { v4 as uuid } from "uuid";

/*Guardar consulta */
export async function saveQuery(data) {
  const pool = await getPool();
  const id = uuid();

  await pool.request()
    .input("id", id)
    .input("sessionId", data.sessionId)
    .input("sql", data.sql)
    .input("ast", JSON.stringify(data.ast))
    .input("tables", JSON.stringify(data.tables))
    .input("columns", JSON.stringify(data.columns))
    .query(`
    INSERT INTO queries
    (id, session_id, sql_text, ast, tables, columns, created_at)
    VALUES
    (@id, @sessionId, @sql, @ast, @tables, @columns, GETDATE())
  `);

  return id;
}

/*Listar consultas */
export async function getQueriesBySession(sessionId) {
  const pool = await getPool();

  const result = await pool.request()
    .input("sessionId", sessionId)
    .query(`
      SELECT 
        id,
        session_id,
        sql_text,
        ast,
        tables,
        columns,
        created_at
      FROM queries
      WHERE session_id = @sessionId
      ORDER BY created_at DESC
    `);

  return result.recordset;
}
