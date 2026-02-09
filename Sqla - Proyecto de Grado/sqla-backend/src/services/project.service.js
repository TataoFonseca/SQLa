import { getPool } from "../db/mssql.js";
import { v4 as uuid } from "uuid";

/* 1️⃣ Guardar consulta */
export async function saveQuery(data) {
    const pool = await getPool();
    const id = uuid();

    await pool.request()
        .input("id", id)
        .input("sql", data.sql)
        .input("ast", JSON.stringify(data.ast))
        .input("tables", JSON.stringify(data.tables))
        .input("columns", JSON.stringify(data.columns))
        .query(`
      INSERT INTO queries
      (id, sql_text, ast, tables, columns, created_at)
      VALUES
      (@id, @sql, @ast, @tables, @columns, GETDATE())
    `);

    return id;
}

/* 2️⃣ Listar consultas */
export async function getQueries() {
    const pool = await getPool();

    const result = await pool.request().query(`
    SELECT 
      id,
      sql_text,
      ast,
      tables,
      columns,
      created_at
    FROM queries
    ORDER BY created_at DESC
  `);

    return result.recordset;
}
